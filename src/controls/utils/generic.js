/**
 * Returns whether or not obj is a number
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isMap(obj) {
  return Object.prototype.toString.apply(obj) === "[object Map]";
}
/**
 * Returns whether or not obj is a number
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isNumber(obj) {
  return Object.prototype.toString.apply(obj) === "[object Number]";
}
/**
 * Returns whether or not obj is a Date object.
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isDate(obj) {
  return Object.prototype.toString.apply(obj) === "[object Date]";
}
export function isObject(obj) {
  return Object.prototype.toString.apply(obj) === "[object Object]";
}
/**
 * Returns whether or not obj is a string
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isString(obj) {
  return typeof obj === "string";
}

export function isStringOrNumber(obj) {
  const type = typeof obj;
  return type === "string" || type === "number";
}
/**
 * Returns whether or not obj is a regular expression object
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isRegExp(obj) {
  return Object.prototype.toString.apply(obj) === "[object RegExp]";
}
/**
 * Returns whether or not obj is a function object
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isFunction(obj) {
  return Object.prototype.toString.apply(obj) === "[object Function]";
}

/**
 * Returns whether or not obj is a Promise
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isPromise(obj) {
  return Promise.resolve(obj) === obj;
}
/**
 * Returns whether an object is empty
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isEmpty(obj) {
  return (
    isNullOrUndefined(obj) ||
    (obj.constructor === Object && Object.keys(obj).length === 0)
  );
}

/**
 * Returns whether or not obj is an observable
 * @param  {object}  obj
 * @return {Boolean}
 */
export function isObservable(obj) {
  return obj && obj.subscribe !== undefined;
}

/**
 * Escapes all RegExp special characters.
 */
export function escapeRegex(re) {
  return re.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
/**
 * Returns the first element in the array that satisfies the given predicate
 * @param  {Array} array     the array to search
 * @param  {function} predicate Function to apply to each element until it returns true
 * @return {Object}           The first object in the array that satisfies the predicate or undefined.
 */
export function findInArray(array, predicate) {
  if (this.isArray(array) && predicate) {
    for (let i = 0; i < array.length; i += 1) {
      const item = array[i];
      if (predicate(item)) {
        return item;
      }
    }
  }
  return undefined;
}
export const union = (arg0, arg1) => {
  if (arg1) {
    return [...new Set(arg0.concat(arg1))];
  }
  let res;
  if (arg1) {
    res = [...arg[0].concat(arg[1])];
  } else {
    res = arg0.reduce((acc, array) => {
      if (!acc.length) {
        acc = array || [];
      } else {
        acc = acc.concat(array);
      }
      return acc;
    }, []);
  }
  res = [...new Set(res)];
  // res.sort((a,b)=>);
  return res;
};
// calculate the intersection of two arrays (arg1 is the second array) or an array of arrays (arg0)
export const intersection = (arg0, arg1) => {
  const intersection_ = (arg0, arg1) => {
    if (isUndefined(arg0)) {
      return arg1;
    } else if (isUndefined(arg1)) {
      return arg0;
    } else {
      const n = arg0.length;
      const m = arg1.length;
      let i = 0;
      let j = 0;
      const res = [];
      while (i < n && j < m) {
        if (arg0[i] > arg1[j]) {
          j += 1;
        } else if (arg0[i] < arg1[j]) {
          i += 1;
        } else {
          res.push(arg0[i]);
          i += 1;
          j += 1;
        }
      }
      return res;
    }
  };
  if (arg1) {
    return intersection_(arg0, arg1);
  } else if (!arg0.length) {
    return [];
  } else if (arg0.length === 1) {
    return arg0[0];
  } else {
    return arg0
      .slice(1)
      .reduce((acc, array) => intersection_(acc, array), arg0[0]);
  }
};
export const hasIntersection = (arg0, arg1) => {
  if (isUndefined(arg0) || isUndefined(arg1)) {
    return true;
  } else {
    const n = arg0.length;
    const m = arg1.length;
    let i = 0;
    let j = 0;
    // const res = [];
    while (i < n && j < m) {
      if (arg0[i] > arg1[j]) {
        j += 1;
      } else if (arg0[i] < arg1[j]) {
        i += 1;
      } else {
        return true;
      }
    }
    return false;
  }
};

export function isInRange(
  { columns: columnIndex, rows: rowIndex },
  { columns: columnIndexStart, rows: rowIndexStart },
  { columns: columnIndexEnd, rows: rowIndexEnd }
) {
  let inRows = false;
  if (columnIndexStart <= columnIndexEnd) {
    inRows = columnIndexStart <= columnIndex && columnIndex <= columnIndexEnd;
  } else {
    inRows = columnIndexEnd <= columnIndex && columnIndex <= columnIndexStart;
  }
  let inColumns = false;
  if (rowIndexStart <= rowIndexEnd) {
    inColumns = rowIndexStart <= rowIndex && rowIndex <= rowIndexEnd;
  } else {
    inColumns = rowIndexEnd <= rowIndex && rowIndex <= rowIndexStart;
  }
  return inRows && inColumns;
}

export function isNull(obj) {
  return obj === null;
}

export function isUndefined(obj) {
  return obj === undefined;
}

export function isNullOrUndefined(obj) {
  return isUndefined(obj) || isNull(obj);
}
export function isNullValue(obj) {
  return isUndefined(obj) || isNull(obj) || obj === "";
}

export function toAccessorFunction(accessor) {
  if (typeof accessor === "string") {
    return row => row[accessor];
  }
  return accessor;
}

export function nullValue(obj, alternativeValue) {
  return isNullValue(obj) ? alternativeValue : obj;
}

/* eslint-disable no-param-reassign */
export const range = (a, b) =>
  Array.from(
    (function*(x, y) {
      while (x <= y) {
        yield x;
        x += 1;
      }
    })(a, b)
  );
// -----------------------------------
// conversion functions
// -----------------------------------
// date functions
// export const isDate = d => d instanceof Date && !isNaN(d.valueOf());
export const formatValue = (value, fmt, ndec) => {
  // format not managed yet
  if (isNullOrUndefined(value)) {
    return null;
  } else if (isDate(value)) {
    return dateToString(value, fmt);
  } else if (isNumber(value)) {
    return numberToString(value, fmt, ndec);
  } else if (typeof value === "object") {
    return "[object]";
  } else if (typeof value === "function") {
    return "[function]";
  } else {
    return value;
  }
};
export const numberToString = (n, fmt, ndec) => {
  let v = n,
    v2 = "";
  if (!isNullOrUndefined(ndec)) {
    const nf = n.toFixed(ndec);
    v = Number(nf);
    const nn = nf.length - v.toString().length;
    if (nn > 0) {
      v2 = nf.slice(nf.length - nn);
    }
  }
  if (!fmt || fmt === "LocaleString") {
    v = v.toLocaleString();
    if (v2 !== "") {
      const separator = (0.1).toLocaleString().slice(1, 2);
      if (separator !== ".") {
        v2 = v2.replace(".", separator);
      }
    }
  } else if (fmt === "String") {
    v = v.toString();
  }

  return v + v2;
};

export const dateToString = (d, fmt) => {
  // format not managed yet
  if (!isDate(d)) {
    return undefined;
  }
  if (isNullValue(fmt) || fmt === "LocaleDateString")
    return d.toLocaleDateString();
  else if (fmt === "LocaleString") return d.toLocaleString();
  else if (fmt === "ISO")
    // else if (fmt === "LocaleTimeString") return d.toLocaleTimeString();
    return d.toISOString();
  else if (fmt === "UTC") return d.toUTCString();
  const date = {
    dd: String(d.getDate()).padStart(2, "0"),
    mm: String(d.getMonth() + 1).padStart(2, "0"),
    yy: String(d.getFullYear()),
    hh: String(d.getHours()).padStart(2, "0"),
    mi: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0")
  };
  const format = fmt.split(/[/: ]/);
  let index = 0,
    dd = "";
  format.forEach(f => {
    const x = date[f.slice(0, 2)];
    if (x) {
      index += f.length + 1;
      dd += x + (fmt[index - 1] || " ");
    }
  });
  return dd.slice(0, dd.length - 1);
};
// export const monthToString = (d, fmt) => {
//   // format not managed yet
//   if (!isDate(d)) {
//     return undefined;
//   }
//   if (isNullValue(fmt) || fmt === "LocaleDateString")
//     return d.toLocaleDateString();
//   else if (fmt === "LocaleString") return d.toLocaleString();
//   else if (fmt === "ISO")
//     // else if (fmt === "LocaleTimeString") return d.toLocaleTimeString();
//     return d.toISOString();
//   else if (fmt === "UTC") return d.toUTCString();
//   const date = {
//     dd: String(d.getDate()).padStart(2, "0"),
//     mm: String(d.getMonth() + 1).padStart(2, "0"),
//     yy: String(d.getFullYear()),
//     hh: String(d.getHours()).padStart(2, "0"),
//     mi: String(d.getMinutes()).padStart(2, "0"),
//     ss: String(d.getSeconds()).padStart(2, "0")
//   };
//   const format = fmt.split(/[/: ]/);
//   let index = 0,
//     dd = "";
//   format.forEach(f => {
//     const x = date[f.slice(0, 2)];
//     if (x) {
//       index += f.length + 1;
//       dd += x + (fmt[index - 1] || " ");
//     }
//   });
//   return dd.slice(0, dd.length - 1);
// };
// export const yearToString = (d, fmt) => {
//   // format not managed yet
//   if (!isDate(d)) {
//     return undefined;
//   }
//   if (isNullValue(fmt) || fmt === "LocaleDateString")
//     return d.toLocaleDateString();
//   else if (fmt === "LocaleString") return d.toLocaleString();
//   else if (fmt === "ISO")
//     // else if (fmt === "LocaleTimeString") return d.toLocaleTimeString();
//     return d.toISOString();
//   else if (fmt === "UTC") return d.toUTCString();
//   const date = {
//     dd: String(d.getDate()).padStart(2, "0"),
//     mm: String(d.getMonth() + 1).padStart(2, "0"),
//     yy: String(d.getFullYear()),
//     hh: String(d.getHours()).padStart(2, "0"),
//     mi: String(d.getMinutes()).padStart(2, "0"),
//     ss: String(d.getSeconds()).padStart(2, "0")
//   };
//   const format = fmt.split(/[/: ]/);
//   let index = 0,
//     dd = "";
//   format.forEach(f => {
//     const x = date[f.slice(0, 2)];
//     if (x) {
//       index += f.length + 1;
//       dd += x + (fmt[index - 1] || " ");
//     }
//   });
//   return dd.slice(0, dd.length - 1);
// };
// export const toMonth = d => {
//   const d_ = new Date(d);
//   d_.setDate(1);
//   return new Date(d_);
// };
// export const toYear = d => {
//   const d_ = new Date(d);
//   d_.setDate(1);
//   d_.setMonth(0);
//   return new Date(d_);
// };
const getLocalDateOrder = () => {
  const sd = new Date(1, 1, 3, 4, 5, 6).toLocaleString();
  const pos = [];
  for (let i = 1; i < 7; i++) {
    pos.push({ tp: i - 1, pos: sd.search(i.toString()) });
  }
  pos.sort((a, b) => (a.pos > b.pos) - (a.pos < b.pos));

  return pos.map(x => x.tp);
};
export const localDateOrder = getLocalDateOrder();
const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const stringToDate = s => {
  // format not managed yet
  //  a voir culture
  if (!s) {
    return null;
  }
  const ds_ = s.split(/[.:/ ]+/g);
  const ds = ["", "", ""];
  for (let i = 0; i < 3; i++) {
    ds[localDateOrder[i]] = ds_[i];
  }
  const d = ds.map(v => parseInt(v, 10));
  if (ds_.length !== 3) {
    return undefined;
  }
  // a voir 12 mois nb days...
  // months 0..11 ??????
  if (ds[1] > 12) {
    return undefined;
  }
  if (ds[0] < 2000 || ds[2] > 3000) {
    return undefined;
  }
  const nDays = daysByMonth[d[1] - 1] + (d[1] === 2 && !(d[0] % 4));
  if (d[2] > nDays) {
    return undefined;
  }
  return !isNaN(Date.parse(`${ds[0]}-${ds[1]}-${ds[2]}`))
    ? new Date(`${ds[0]}-${ds[1].padStart(2, 0)}-${ds[2].padStart(2, 0)}`)
    : undefined;
};
export const stringToMonth = s => {
  // format not managed yet
  //  a voir culture
  if (!s) {
    return null;
  }
  const ds = s.split(/[.:/ ]+/g);
  const d = ds.map(v => parseInt(v, 10));
  if (d.length !== 2) {
    return undefined;
  }
  // a voir 12 mois nb days...
  // months 0..11 ??????
  if (ds[0] > 12) {
    return undefined;
  }
  if (ds[1] < 2000 || ds[2] > 3000) {
    return undefined;
  }
  return !isNaN(Date.parse(`${ds[1]}-${ds[0]}-01`))
    ? new Date(`${ds[1]}-${ds[0].padStart(2, 0)}-01`)
    : undefined;
};
export const stringToYear = s => {
  // format not managed yet
  //  a voir culture
  if (!s) {
    return null;
  }
  const y = parseInt(s, 10);
  if (isNaN(y)) {
    return undefined;
  }
  if (y < 2000 || y > 3000) {
    return undefined;
  }
  return new Date(`${y}-01-01`);
};
// -------------------------------------------
//  key management
//  ------------------------------------------

export const keyMap = {
  9: "Tab",
  13: "Enter",
  27: "Escape",
  32: "Space",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  107: "+",
  109: "-",
  187: "=",
  65: "a",
  70: "f",
  112: "f1",
  113: "f2",
  114: "f3",
  115: "f4",
  116: "f5",
  117: "f6",
  118: "f7",
  119: "f8",
  120: "f9",
  121: "f10",
  122: "f11",
  123: "f12",
  48: "0",
  96: "numpad0"
};

export const isNavigationKey = e => {
  const keyCode = e.which || e.keyCode;
  return (
    (keyCode >= 32 && keyCode < 41) || // space+arrows...
    keyCode === 9 || // tab
    keyCode === 27 || // escape
    keyCode === 13 || // enter
    (keyCode === 65 && (e.metaKey || e.ctrlKey)) // ctrl a
  );
};
export const isZoom = e => {
  const keyCode = e.which || e.keyCode;
  return (
    (e.metaKey || e.ctrlKey) *
    (keyCode === 107 || keyCode === 187 || -(keyCode === 109))
  );
};
//------------------------------------------------
// Copy, ...paste,export
// -----------------------------------------------
export const copy = text => {
  try {
    const bodyElement = document.getElementsByTagName("body")[0];
    const clipboardTextArea = document.createElement("textarea");
    clipboardTextArea.style.position = "absolute";
    clipboardTextArea.style.left = "-10000px";
    bodyElement.appendChild(clipboardTextArea);
    clipboardTextArea.innerHTML = text;
    clipboardTextArea.select();
    window.setTimeout(() => {
      bodyElement.removeChild(clipboardTextArea);
    }, 0);
  } catch (error) {
    /* eslint-disable no-console */
    console.error("error during copy", error);
    /* eslint-enable */
  }
};
export const exportFile = (content, fileName, mime) => {
  if (mime == null) {
    mime = "text/csv";
  }
  var blob = new Blob([content], { type: mime });
  var a = document.createElement("a");
  a.download = fileName;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = [mime, a.download, a.href].join(":");
  var e = document.createEvent("MouseEvents");
  e.initMouseEvent(
    "click",
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  return a.dispatchEvent(e);
};

const functionsByObject = (object, functions) => {
  const f = functions[object];
  const f_ = [];
  Object.keys(f).forEach(type => {
    const tp = type.slice(0, type.length - 1);
    Object.keys(f[type]).forEach(code => {
      const functionJS = f[type][code];
      if (functionJS) {
        f_.push({
          id: code,
          visibility: object === "globals_" ? "global" : object,
          caption: code,
          tp,
          functionJS
        });
      }
    });
  });
  return f_;
};
export const arrayToObject = (aa, k) => {
  if (isNullOrUndefined(aa)) {
    return {};
  }
  if (!Array.isArray(aa)) {
    return aa;
  }
  return aa.reduce((acc, a) => {
    acc[a[k]] = a;
    return acc;
  }, {});
};
export const objectToArray = oo => {
  if (isNullOrUndefined(oo)) {
    return [];
  }
  if (Array.isArray(oo)) {
    return oo;
  }
  return Object.values(oo);
};
