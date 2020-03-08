import { Store } from "redux";

interface ICacheKeyUtilState {
  readonly [key: string]: number;
}

interface ICacheKeyUtilAction {
  readonly type: CacheKeyUtilActions | "@@INIT";
  readonly key?: string;
}

enum CacheKeyUtilActions {
  TOUCH = "CacheKeyUtilActions.TOUCH",
}

class CacheKeyUtil<State> {
  public static STATE_KEY = "__cache";
  public static store?: Store;

  public static setStore(store: Store): void {
    CacheKeyUtil.store = store;
  }

  public static touchKey(key: string): ICacheKeyUtilAction {
    CacheKeyUtil.checkStore();
    return {
      type: CacheKeyUtilActions.TOUCH,
      key,
    };
  }

  public static getKeyTime(key: string): number {
    CacheKeyUtil.checkStore();
    const state = CacheKeyUtil.store.getState()[this.STATE_KEY] as ICacheKeyUtilState;
    return state[key] || 0;
  }

  public static keyIsValid(key: string, dependencies: string[]): boolean {
    CacheKeyUtil.checkStore();
    const keyTime = CacheKeyUtil.getKeyTime(key);
    if (keyTime === 0) {
      return false;
    }
    let valid = true;
    dependencies.forEach((d) => {
      if (CacheKeyUtil.getKeyTime(d) >= keyTime) {
        valid = false;
      }
    });
    return valid;
  }

  public static reducer(state: ICacheKeyUtilState = {}, action: ICacheKeyUtilAction): ICacheKeyUtilState {
    switch (action.type) {
      case CacheKeyUtilActions.TOUCH:
        return {
          ...state,
          [action.key]: CacheKeyUtil.getTimestamp(),
        };

      default:
        return state;
    }
  }

  private static maxTimestampGiven = 0;

  private static checkStore(): void {
    if (!CacheKeyUtil.store) {
      throw new Error("Store is not set");
    }
  }

  private static getTimestamp(): number {
    const raw = new Date().getTime();
    const output = raw > this.maxTimestampGiven ? raw : this.maxTimestampGiven + 1;
    this.maxTimestampGiven = output;
    return output;
  }
}

export { ICacheKeyUtilState, ICacheKeyUtilAction, CacheKeyUtilActions, CacheKeyUtil };
