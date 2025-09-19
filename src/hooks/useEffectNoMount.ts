import { type DependencyList, type EffectCallback, useEffect, useRef } from "react";

export const useIsMount = () => {
  const isMountRef = useRef(true);
  useEffect(() => {
    isMountRef.current = false;
  }, []);
  return isMountRef.current;
};

export const useEffectNoMount = (effect: EffectCallback, deps?: DependencyList) => {
  const isMount = useIsMount();
  useEffect(() => {
    if (!isMount) {
      effect();
    }
  }, deps)
};
