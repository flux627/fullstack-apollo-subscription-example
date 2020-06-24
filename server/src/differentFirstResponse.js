import { $$asyncIterator } from 'iterall';


export const differentFirstResponse = (asyncIteratorFn, getInitialPayload) => {
  return (rootValue, args, context, info) => {
    const asyncIterator = asyncIteratorFn(rootValue, args, context, info);
    let isInitial = true

    const getNextPromise = () => {
      return asyncIterator
        .next()
        .then(({ value, done }) => {
          if (isInitial === true) {
            isInitial = false
            const initialPayload = getInitialPayload()
            return { value: initialPayload, done };
          }
          return { value, done }
        });
    };

    return {
      next() {
        return getNextPromise()
      },
      return() {
        return asyncIterator.return();
      },
      throw(error) {
        return asyncIterator.throw(error);
      },
      [$$asyncIterator]() {
        return this;
      },
    };
  };
};
