

if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

export const Logger = {
  log: __DEV__ ? console.log : () => {},
  warn: __DEV__ ? console.warn : () => {},
  error: console.error, // Always show errors
};

export default Logger;

