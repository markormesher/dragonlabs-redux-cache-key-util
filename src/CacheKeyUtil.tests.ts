import * as chai from "chai";
import { expect } from "chai";
import { after, beforeEach, describe, it } from "mocha";
import { combineReducers, createStore } from "redux";
import { ICacheKeyUtilAction, ICacheKeyUtilState, CacheKeyUtil, CacheKeyUtilActions } from "./CacheKeyUtil";

chai.should();

describe(__filename, () => {
  function resetStore(state: ICacheKeyUtilState = {}): void {
    const store = createStore(
      combineReducers({
        [CacheKeyUtil.STATE_KEY]: CacheKeyUtil.reducer,
      }),
      {
        [CacheKeyUtil.STATE_KEY]: state,
      },
    );
    CacheKeyUtil.setStore(store);
  }

  beforeEach(() => {
    resetStore();
  });

  after(() => {
    CacheKeyUtil.setStore(undefined);
  });

  describe("touchKey()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.touchKey("key")).to.throw();
    });

    it("should generate an action with the correct type", () => {
      CacheKeyUtil.touchKey("test-key").type.should.equal(CacheKeyUtilActions.TOUCH);
    });

    it("should generate an action with the provided key", () => {
      CacheKeyUtil.touchKey("test-key").key.should.equal("test-key");
    });
  });

  describe("getKeyTime()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.getKeyTime("key")).to.throw();
    });

    it("should return zero for keys that have not been set", () => {
      CacheKeyUtil.getKeyTime("test-key").should.equal(0);
    });

    it("should return the key time for keys that have been set", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key"));
      resetStore(state);
      CacheKeyUtil.getKeyTime("test-key").should.equal(state["test-key"]);
    });
  });

  describe("keyIsValid()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.keyIsValid("key", [])).to.throw();
    });

    it("should return false for unset keys with no dependencies", () => {
      CacheKeyUtil.keyIsValid("test-key", []).should.equal(false);
    });

    it("should return false for unset keys with dependencies", () => {
      CacheKeyUtil.keyIsValid("test-key1", ["test-key-2"]).should.equal(false);
    });

    it("should return true for keys with no dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key", []).should.equal(true);
    });

    it("should return true for keys with unset dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key1"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key1", ["test-key2"]).should.equal(true);
    });

    it("should return true for keys set after all dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key2"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key1"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key1", ["test-key2"]).should.equal(true);
    });

    it("should return false for keys set before all dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key2"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key1", ["test-key2"]).should.equal(false);
    });

    it("should return false for keys set before some dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key3"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key2"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key1", ["test-key2", "test-key3"]).should.equal(false);
    });
  });

  describe("reducer()", () => {
    it("should initialise its state as an empty object", () => {
      CacheKeyUtil.reducer({}, { type: "@@INIT" }).should.deep.equal({});
    });

    it("should not mutate the state when an unrecognised action is passed", () => {
      const state = {};
      const action: ICacheKeyUtilAction = { type: CacheKeyUtilActions.TOUCH, key: "" };
      Object.defineProperty(action, "type", { writable: true, value: "random-action" });
      CacheKeyUtil.reducer(state, action).should.equal(state);
    });

    it("should add the key when the TOUCH action is passed", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key"));
      state.should.have.keys("test-key");
      state["test-key"].should.be.greaterThan(0);
    });

    it("should issue increasing key times", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key2"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.touchKey("test-key3"));
      state["test-key1"].should.be.lessThan(state["test-key2"]);
      state["test-key2"].should.be.lessThan(state["test-key3"]);
    });
  });
});
