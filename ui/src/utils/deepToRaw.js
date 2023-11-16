// https://github.com/vuejs/core/issues/5303#issuecomment-1543596383
// TODO deepUnref? https://www.npmjs.com/package/vue-deepunref
import {
  toRaw,
  isRef,
  isReactive,
  isProxy,
} from 'vue';

export function deepToRaw(sourceObj) {
  const objectIterator = (input) => {
    if (Array.isArray(input)) {
      return input.map((item) => objectIterator(item));
    } if (isRef(input) || isReactive(input) || isProxy(input)) {
      return objectIterator(toRaw(input));
    } if (input && typeof input === 'object') {
      return Object.keys(input).reduce((acc, key) => {
        acc[ key ] = objectIterator(input[ key ]);
        return acc;
      }, {});
    }
    return input;
  };

  return objectIterator(sourceObj);
}
