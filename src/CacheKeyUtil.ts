import { Store } from "redux";

interface ICacheKeyUtilState {
  readonly [key: string]: number;
}

interface ICacheKeyUtilAction {
  readonly type: CacheKeyUtilActions | "@@INIT";
  readonly key?: string;
}

enum CacheKeyUtilActions {
  UPDATE = "CacheKeyUtilActions.UPDATE",
  INVALIDATE = "CacheKeyUtilActions.INVALIDATE",
}

class CacheKeyUtil {
  public static STATE_KEY = "__cache";
  public static store?: Store;
  public static maxTimestampGiven = 0;
  public static MIN_VALID_KEY = 0;

  public static setStore(store: Store): void {
    CacheKeyUtil.store = store;
  }

  public static updateKey(key: string): ICacheKeyUtilAction {
    CacheKeyUtil.checkStore();

    return {
      type: CacheKeyUtilActions.UPDATE,
      key,
    };
  }

  public static invalidateKey(key: string): ICacheKeyUtilAction {
    CacheKeyUtil.checkStore();
    return {
      type: CacheKeyUtilActions.INVALIDATE,
      key,
    };
  }

  public static getKeyTime(key: string): number {
    CacheKeyUtil.checkStore();
    const state = CacheKeyUtil.store.getState()[CacheKeyUtil.STATE_KEY] as ICacheKeyUtilState;
    return state[key] || CacheKeyUtil.MIN_VALID_KEY - 1;
  }

  public static getMinKeyTime(keys: string[]): number {
    CacheKeyUtil.checkStore();
    if (!keys || keys.length === 0) {
      return CacheKeyUtil.MIN_VALID_KEY - 1;
    }

    const keyTimes = keys.map((key) => CacheKeyUtil.getKeyTime(key));
    return Math.min(...keyTimes);
  }

  public static getMaxKeyTime(keys: string[]): number {
    if (!keys || keys.length === 0) {
      return CacheKeyUtil.MIN_VALID_KEY - 1;
    }

    const keyTimes = keys.map((key) => CacheKeyUtil.getKeyTime(key));
    return Math.max(...keyTimes);
  }

  public static keyIsValid(key: string, dependencies: string[] = []): boolean {
    CacheKeyUtil.checkStore();

    const keyTime = CacheKeyUtil.getKeyTime(key);
    const maxDependencyTime = CacheKeyUtil.getMaxKeyTime(dependencies);

    return keyTime >= CacheKeyUtil.MIN_VALID_KEY && keyTime > maxDependencyTime;
  }

  public static reducer(state: ICacheKeyUtilState = {}, action: ICacheKeyUtilAction): ICacheKeyUtilState {
    switch (action.type) {
      case CacheKeyUtilActions.UPDATE:
        return {
          ...state,
          [action.key]: CacheKeyUtil.getTimestamp(),
        };

      case CacheKeyUtilActions.INVALIDATE:
        return {
          ...state,
          [action.key]: CacheKeyUtil.MIN_VALID_KEY - 1,
        };

      default:
        return state;
    }
  }

  private static checkStore(): void {
    if (!CacheKeyUtil.store) {
      throw new Error("Store is not set");
    }
  }

  private static getTimestamp(): number {
    const raw = new Date().getTime();
    const output = raw > CacheKeyUtil.maxTimestampGiven ? raw : CacheKeyUtil.maxTimestampGiven + 1;
    CacheKeyUtil.maxTimestampGiven = output;
    return output;
  }
}

export { CacheKeyUtil, CacheKeyUtilActions, ICacheKeyUtilAction, ICacheKeyUtilState };
