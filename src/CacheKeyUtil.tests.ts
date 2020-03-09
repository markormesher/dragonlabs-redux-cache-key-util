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

  describe("updateKey()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.updateKey("test-key")).to.throw();
    });

    it("should generate an action with the correct type", () => {
      CacheKeyUtil.updateKey("test-key").type.should.equal(CacheKeyUtilActions.UPDATE);
    });

    it("should generate an action with the provided key", () => {
      CacheKeyUtil.updateKey("test-key").key.should.equal("test-key");
    });
  });

  describe("invalidateKey()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.invalidateKey("test-key")).to.throw();
    });

    it("should generate an action with the correct type", () => {
      CacheKeyUtil.invalidateKey("test-key").type.should.equal(CacheKeyUtilActions.INVALIDATE);
    });

    it("should generate an action with the provided key", () => {
      CacheKeyUtil.invalidateKey("test-key").key.should.equal("test-key");
    });
  });

  describe("getKeyTime()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.getKeyTime("test-key")).to.throw();
    });

    it("should return an invalid timestamp for keys that have not been set", () => {
      CacheKeyUtil.getKeyTime("test-key").should.be.lessThan(CacheKeyUtil.MIN_VALID_KEY);
    });

    it("should return an invalid timestamp for keys that have been reset", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.invalidateKey("test-key"));
      resetStore(state);
      CacheKeyUtil.getKeyTime("test-key").should.be.lessThan(CacheKeyUtil.MIN_VALID_KEY);
    });

    it("should return the key time for keys that have been set", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key"));
      resetStore(state);
      CacheKeyUtil.getKeyTime("test-key").should.equal(state["test-key"]);
    });
  });

  describe("getMinKeyTime()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.getMinKeyTime([])).to.throw();
    });

    it("should return an invalid timestamp when called with no keys", () => {
      CacheKeyUtil.getMinKeyTime([]).should.be.lessThan(CacheKeyUtil.MIN_VALID_KEY);
    });

    it("should return an invalid timestamp for keys that have not been set", () => {
      CacheKeyUtil.getMinKeyTime(["test-key"]).should.be.lessThan(CacheKeyUtil.MIN_VALID_KEY);
    });

    it("should return an invalid timestamp for a mix of set and unset keys", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      resetStore(state);
      CacheKeyUtil.getMinKeyTime(["test-key-1", "test-key-2"]).should.be.lessThan(CacheKeyUtil.MIN_VALID_KEY);
    });

    it("should return the lowest timestamp for a set of valid keys", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-2"));
      resetStore(state);
      CacheKeyUtil.getMinKeyTime(["test-key-1", "test-key-2"]).should.equal(
        Math.min(state["test-key-1"], state["test-key-2"]),
      );
    });
  });

  describe("keyIsValid()", () => {
    it("should throw an exception when the store is not set", () => {
      CacheKeyUtil.setStore(undefined);
      expect(() => CacheKeyUtil.keyIsValid("test-key")).to.throw();
    });

    it("should return false for unset keys with no dependencies", () => {
      CacheKeyUtil.keyIsValid("test-key").should.equal(false);
      CacheKeyUtil.keyIsValid("test-key", []).should.equal(false);
    });

    it("should return false for unset keys with dependencies", () => {
      CacheKeyUtil.keyIsValid("test-key-1", ["test-key-2"]).should.equal(false);
    });

    it("should return true for valid keys with no dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key").should.equal(true);
    });

    it("should return true for valid keys with unset dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key-1", ["test-key-2"]).should.equal(true);
    });

    it("should return true for keys set after all dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-2"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key-1", ["test-key-2"]).should.equal(true);
    });

    it("should return false for keys set before all dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-2"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key-1", ["test-key-2"]).should.equal(false);
    });

    it("should return false for keys set before some dependencies", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-3"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-2"));
      resetStore(state);
      CacheKeyUtil.keyIsValid("test-key-1", ["test-key-2", "test-key-3"]).should.equal(false);
    });
  });

  describe("reducer()", () => {
    it("should initialise its state as an empty object", () => {
      CacheKeyUtil.reducer({}, { type: "@@INIT" }).should.deep.equal({});
    });

    it("should not mutate the state when an unrecognised action is passed", () => {
      const state = {};
      const action: ICacheKeyUtilAction = { type: CacheKeyUtilActions.UPDATE, key: "" };
      Object.defineProperty(action, "type", { writable: true, value: "random-action" });
      CacheKeyUtil.reducer(state, action).should.equal(state);
    });

    it("should add the key when the UPDATE action is passed", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key"));
      state.should.have.keys("test-key");
      state["test-key"].should.be.greaterThan(0);
    });

    it("should issue increasing key times", () => {
      let state: ICacheKeyUtilState = {};
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-1"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-2"));
      state = CacheKeyUtil.reducer(state, CacheKeyUtil.updateKey("test-key-3"));
      state["test-key-1"].should.be.lessThan(state["test-key-2"]);
      state["test-key-2"].should.be.lessThan(state["test-key-3"]);
    });
  });
});
