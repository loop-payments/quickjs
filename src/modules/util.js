export default `

class TextEncoder {
    encode(input = '') {
        const utf8 = unescape(encodeURIComponent(input));
        const result = new Uint8Array(utf8.length);
        
        for (let i = 0; i < utf8.length; i++) {
            result[i] = utf8.charCodeAt(i);
        }
          
        return result;
    }
}

// The engine limits the number of arguments for one function call. The
// decoder sends the bytes in chunks of this size to stay under the limit.
const DECODE_CHUNK_SIZE = 8192;

// The WHATWG encoding standard defines the decoder input as a BufferSource. A
// BufferSource is an ArrayBuffer or a view on an ArrayBuffer. The decoder
// reads the bytes through a Uint8Array. An ArrayBuffer has no index access,
// and a signed view returns negative numbers.
function toUint8Array(input) {
    if (input === undefined) {
        return new Uint8Array();
    }
    if (input instanceof Uint8Array) {
        return input;
    }
    if (ArrayBuffer.isView(input)) {
        // The new array must keep the offset and the length of the input
        // view. An array over the full buffer decodes the wrong bytes.
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    throw new TypeError('TextDecoder.decode accepts an ArrayBuffer or a view on an ArrayBuffer');
}

class TextDecoder {
    constructor(encoding = 'utf-8') {
        if (encoding !== 'utf-8') {
            throw new Error('Only utf-8 encoding is supported');
        }
    }

    decode(input) {
        const bytes = toUint8Array(input);
        // One call to String.fromCharCode per chunk is much faster than one
        // call per byte. A chunk that splits a multibyte sequence is safe,
        // because decodeURIComponent reads the full string.
        let latin1 = '';
        for (let i = 0; i < bytes.length; i += DECODE_CHUNK_SIZE) {
          latin1 += String.fromCharCode.apply(null, bytes.subarray(i, i + DECODE_CHUNK_SIZE));
        }
        return decodeURIComponent(escape(latin1));
    }
}

// Promisify: converts a callback-based function to a promise-based one
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// Callbackify: converts a promise-based function to a callback-based one
function callbackify(fn) {
  return function (...args) {
    const cb = args.pop();
    fn(...args)
      .then((result) => cb(null, result))
      .catch((err) => cb(err));
  };
}

// Inherits: implements inheritance
function inherits(ctor, superCtor) {
  if (typeof superCtor !== 'function' && superCtor !== null) {
    throw new TypeError('Super constructor must either be a function or null');
  }

  ctor.super_ = superCtor;
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  } else {
    ctor.prototype.__proto__ = superCtor.prototype;
  }
}

// Deprecate: marks a method as deprecated
function deprecate(fn, msg) {
  let warned = false;
  function deprecated(...args) {
    if (!warned) {
      console.warn(\`DeprecationWarning: \${msg}\`);
      warned = true;
    }
    return fn.apply(this, args);
  }
  return deprecated;
}

const types = {
    isAnyArrayBuffer(value) {
      return value instanceof ArrayBuffer || value instanceof SharedArrayBuffer;
    },
    isArrayBufferView(value) {
      return ArrayBuffer.isView(value);
    },
    isArgumentsObject(value) {
      return Object.prototype.toString.call(value) === '[object Arguments]';
    },
    isArrayBuffer(value) {
      return value instanceof ArrayBuffer;
    },
    isAsyncFunction(value) {
      return Object.prototype.toString.call(value) === '[object AsyncFunction]';
    },
    isBigInt64Array(value) {
      return value instanceof BigInt64Array;
    },
    isBigUint64Array(value) {
      return value instanceof BigUint64Array;
    },
    isBooleanObject(value) {
      return typeof value === 'object' && typeof value.valueOf() === 'boolean';
    },
    isBoxedPrimitive(value) {
      return ['[object Number]', '[object String]', '[object Boolean]', '[object Symbol]'].includes(Object.prototype.toString.call(value));
    },
    isCryptoKey(value) {
      return typeof CryptoKey !== 'undefined' && value instanceof CryptoKey;
    },
    isDataView(value) {
      return value instanceof DataView;
    },
    isDate(value) {
      return value instanceof Date;
    },
    isExternal(value) {
      return false; // Node.js specific
    },
    isFloat32Array(value) {
      return value instanceof Float32Array;
    },
    isFloat64Array(value) {
      return value instanceof Float64Array;
    },
    isGeneratorFunction(value) {
      return Object.prototype.toString.call(value) === '[object GeneratorFunction]';
    },
    isGeneratorObject(value) {
      return Object.prototype.toString.call(value) === '[object Generator]';
    },
    isInt8Array(value) {
      return value instanceof Int8Array;
    },
    isInt16Array(value) {
      return value instanceof Int16Array;
    },
    isInt32Array(value) {
      return value instanceof Int32Array;
    },
    isKeyObject(value) {
      return false; // Node.js specific
    },
    isMap(value) {
      return value instanceof Map;
    },
    isMapIterator(value) {
      return Object.prototype.toString.call(value) === '[object Map Iterator]';
    },
    isModuleNamespaceObject(value) {
      return Object.prototype.toString.call(value) === '[object Module]';
    },
    isNativeError(value) {
      return value instanceof Error;
    },
    isNumberObject(value) {
      return typeof value === 'object' && typeof value.valueOf() === 'number';
    },
    isPromise(value) {
      return value instanceof Promise;
    },
    isProxy(value) {
      try {
        Proxy.revocable(value, {});
        return true;
      } catch (e) {
        return false;
      }
    },
    isRegExp(value) {
      return value instanceof RegExp;
    },
    isSet(value) {
      return value instanceof Set;
    },
    isSetIterator(value) {
      return Object.prototype.toString.call(value) === '[object Set Iterator]';
    },
    isSharedArrayBuffer(value) {
      return value instanceof SharedArrayBuffer;
    },
    isStringObject(value) {
      return typeof value === 'object' && typeof value.valueOf() === 'string';
    },
    isSymbolObject(value) {
      return typeof value === 'object' && typeof value.valueOf() === 'symbol';
    },
    isTypedArray(value) {
      return ArrayBuffer.isView(value) && !(value instanceof DataView);
    },
    isUint8Array(value) {
      return value instanceof Uint8Array;
    },
    isUint8ClampedArray(value) {
      return value instanceof Uint8ClampedArray;
    },
    isUint16Array(value) {
      return value instanceof Uint16Array;
    },
    isUint32Array(value) {
      return value instanceof Uint32Array;
    },
    isWeakMap(value) {
      return value instanceof WeakMap;
    },
    isWeakSet(value) {
      return value instanceof WeakSet;
    },
  }


const util = {
  promisify,
  callbackify,
  inherits,
  deprecate,
  types,
  TextEncoder,
  TextDecoder
};

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

export default util;

export { promisify, callbackify, inherits, deprecate, types, TextEncoder,TextDecoder };

`
