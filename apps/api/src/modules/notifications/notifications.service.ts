import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error(`Invalid Expo push token: ${token}`);
    }
    await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken: token } });
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });
    if (!user?.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) return;

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      title,
      body,
      data,
      sound: 'default',
    };
    try {
      await this.expo.sendPushNotificationsAsync([message]);
    } catch (err) {
      this.logger.error(`Push fehlgeschlagen für ${userId}:`, err);
    }
  }

  async notifyToiletOwnerOnRating(toiletId: string, raterUserId: string): Promise<void> {
    const toilet = await this.prisma.toilet.findUnique({
      where: { id: toiletId },
      select: { name: true, createdById: true },
    });
    if (!toilet || toilet.createdById === raterUserId) return;
    await this.sendToUser(
      toilet.createdById,
      '🌸 Neue Bewertung',
      `Deine Toilette «${toilet.name}» wurde bewertet.`,
      { screen: 'toilet', toiletId },
    );
  }

  async notifyPhotoApproved(photoId: string): Promise<void> {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      select: { userId: true, toilet: { select: { name: true } } },
    });
    if (!photo) return;
    await this.sendToUser(
      photo.userId,
      '📸 Foto freigegeben',
      `Dein Foto für «${photo.toilet.name}» wurde freigegeben.`,
      { screen: 'toilet', toiletId: photo.toilet.name },
    );
  }
}
