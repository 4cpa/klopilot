import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type LatLng = { latitude: number; longitude: number };

type MapTargetCtx = {
  target: LatLng | null;
  setTarget: (t: LatLng | null) => void;
};

const Ctx = createContext<MapTargetCtx>({ target: null, setTarget: () => {} });

export function MapTargetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<LatLng | null>(null);
  return <Ctx.Provider value={{ target, setTarget }}>{children}</Ctx.Provider>;
}

export const useMapTarget = () => useContext(Ctx);
