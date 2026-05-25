import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ToiletDoc {
  id: string;
  name: string;
  address: string;
  category: string;
  _geo: { lat: number; lng: number };
}

const INDEX = 'toilets';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Meilisearch } = require('meilisearch');

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(private readonly config: ConfigService) {
    this.client = new Meilisearch({
      host: config.get('MEILI_HOST', 'http://localhost:7710'),
      apiKey: config.get('MEILI_KEY', ''),
    });
  }

  async onModuleInit() {
    try {
      await this.client.createIndex(INDEX, { primaryKey: 'id' }).catch(() => {
        /* exists */
      });
      const idx = this.client.index(INDEX);
      await idx.updateSearchableAttributes(['name', 'address']);
      await idx.updateFilterableAttributes(['category']);
      this.logger.log('Meilisearch-Index "toilets" bereit');
    } catch (e) {
      this.logger.warn('Meilisearch nicht erreichbar — Suche deaktiviert', e);
    }
  }

  async indexToilet(doc: ToiletDoc) {
    try {
      await this.client.index(INDEX).addDocuments([doc]);
    } catch {
      /* Meilisearch optional */
    }
  }

  async indexMany(docs: ToiletDoc[]) {
    if (!docs.length) return;
    try {
      await this.client.index(INDEX).addDocuments(docs);
    } catch {
      /* Meilisearch optional */
    }
  }

  async deleteToilet(id: string) {
    try {
      await this.client.index(INDEX).deleteDocument(id);
    } catch {
      /* ignore */
    }
  }

  async search(q: string, category?: string[]): Promise<ToiletDoc[]> {
    try {
      const filter = category?.length
        ? category.map((c) => `category = "${c}"`).join(' OR ')
        : undefined;
      const res = await this.client.index(INDEX).search(q, { limit: 30, filter });
      return res.hits;
    } catch {
      return [];
    }
  }
}
