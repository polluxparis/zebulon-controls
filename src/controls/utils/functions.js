import { formatValue } from "./generic";
export const utilFunctions = {};
utilFunctions.date = {
  toDate: d => new Date(d),
  toDay: (d, plusDays = 0) => {
    const d_ = new Date(d);
    return new Date(d_.getFullYear(), d_.getMonth(), d_.getDate() + plusDays);
  },
  toMonth: (d, plusMonths = 0, end = false) => {
    const d_ = new Date(d);
    return new Date(
      d_.getFullYear(),
      d_.getMonth() + plusMonths + end,
      1 - end
    );
  },
  toYear: (d, plusYears = 0, end = false) => {
    const d_ = new Date(d);
    return new Date(d_.getFullYear() + plusYears + end, 0, 1 - end);
  }
};
export const functions = functionsObjects => {
  // functions = {};
  // Functions can be specified with <object> or globals_  visibilty, by example for accessors, the row is passed as parameter
  // reference to row columns depends of the dataset and should (in most case) be associated to the dataset id.
  // On the opposite, formats are generally globals.
  // For a type and name, the first function found (visibility then globals_) will be returned
  // functions may be defined in objects at different levels (locally, client, pivot grid, table...)
  // the object must be merged together
  const functionsObject = {};
  let currentVisibility;
  let currentSource;
  // params should store global(session) parameters visible by functions
  let params = {};
  // utils should store untyped generic functions usable by functions
  let utils = utilFunctions;
  const mergeFunctionsObjects = functionsObjects => {
    (Array.isArray(functionsObjects)
      ? functionsObjects.filter(f => f !== undefined)
      : [functionsObjects || {}]).forEach(f => {
      Object.keys(f).forEach(visibility => {
        Object.keys(f[visibility]).forEach(type => {
          Object.keys(f[visibility][type]).forEach(name => {
            setInitialFunction(
              visibility,
              type,
              name,
              name,
              f[visibility][type][name]
            );
          });
        });
      });
    });
  };
  const mergeFunctionsArray = functions => {
    functions.forEach(f => {
      setInitialFunction(f.visibility, f.tp, f.id, f.caption, f.functionText);
    });
  };
  // users defined functions must be protected
  const evalProtectedFunction = text => {
    let f;
    const functionText =
      "message => {try{ return (" +
      text +
      ')(message)} catch (e){return "local function error"}}';
    try {
      eval("f = " + functionText);
    } catch (e) {
      f = () => {};
    }
    return f;
  };
  //
  const initKey = (visibility, type, name) => {
    if (!functionsObject[visibility]) {
      functionsObject[visibility] = {};
    }
    if (!functionsObject[visibility][type]) {
      functionsObject[visibility][type] = {};
    }
    if (!functionsObject[visibility][type][name]) {
      functionsObject[visibility][type][name] = {};
    }
  };

  const getInitialFunction = (visibility, type, name) =>
    functionsObject[visibility][type][name].f0 ||
    functionsObject["globals_"][type][name].f0;
  const getFunction = (
    visibility = currentVisibility,
    type,
    name,
    source = currentSource
  ) =>
    (((functionsObject[visibility] || {})[type] || {})[name] || {}).f ||
    (((functionsObject[source] || {})[type] || {})[name] || {}).f ||
    (((functionsObject.globals_ || {})[type] || {})[name] || {}).f;
  // zebulon table and zebulon grid works with accessors
  // the accessor may be
  // - a function
  // - a reference to a function (string)
  // - a reference to a dataset column or any key ob an object stores in the dataset
  const getAccessorFunction = (visibility, type, name) => {
    // if (visibility) {
    //   setVisibility(visibility);
    // }
    if (typeof name === "function") {
      // function defined in the meta description
      return name;
    } else if (type === "analytics" && typeof name === "object") {
      // function defined in the meta description
      return name;
    } else if (typeof name === "string") {
      // row or function accessor
      const indexDot = name.indexOf(".");
      if (indexDot !== -1) {
        // row accessor
        let v = name;
        if (name.slice(0, indexDot) === "row") {
          v = name.slice(indexDot + 1);
        }
        const keys = v.split(".");
        return ({ row }) =>
          keys.reduce(
            (acc, key, index) =>
              acc[key] === undefined && index < keys.length - 1 ? {} : acc[key],
            row
          );
      } else {
        // function accessor
        const f = getFunction(visibility, type, name, currentSource);
        if (f) {
          return f;
        } else if (type === "formats") {
          return ({ value }) => formatValue(value, name);
        } else {
          return ({ row }) => row[name];
        }
      }
    }
    if (type === "formats") {
      return ({ value }) => formatValue(value);
    }
  };
  const setInitialFunction = (visibility, type, name, caption, f0) => {
    initKey(visibility, type, name);
    let f = f0,
      fText;
    if (typeof f === "string") {
      fText = f;
      f = evalProtectedFunction(f);
    }
    functionsObject[visibility][type][name] = {
      f0: f,
      f,
      fText,
      caption: caption || name
    };
    return f;
  };
  const setFunction = (visibility, type, name, f) => {
    initKey(visibility, type, name);
    functionsObject[visibility][type][name].f = f;
  };
  const composeFunction = (visibility, type, name, args) =>
    setFunction(
      visibility,
      type,
      name,
      (getInitialFunction(visibility, type, name) || (x => undefined))(args)
    );
  const removeFunction = (visibility = currentVisibility, type, name) => {
    if (((functionsObject[visibility] || {})[type] || {})[name]) {
      delete functionsObject[visibility][type][name];
    }
  };
  // get data array for "functions" tab table
  const functionToString = f => {
    if (f.fText) {
      return f.fText;
    } else if (typeof f.f === "function") {
      return String(f.f);
    }
  };
  const getFunctionsArray = (visibility, type, source) => {
    const functions = [];
    const getFunctions = (visibility, type, otherVisibilities = []) => {
      let keys = type ? [type] : Object.keys(functionsObject[visibility] || {});
      if (
        keys &&
        (!type ||
          (functionsObject[visibility] && functionsObject[visibility][type]))
      ) {
        keys.forEach(type => {
          (Object.keys(functionsObject[visibility][type]) || [])
            .forEach(name => {
              if (
                !otherVisibilities.length ||
                otherVisibilities.reduce(
                  (acc, visibility) =>
                    acc &&
                    !((functionsObject[visibility] || {})[type] || {})[name],
                  true
                )
              ) {
                const f = functionsObject[visibility][type][name];
                functions.push({
                  id: name,
                  caption: f.caption,
                  visibility,
                  tp: type,
                  functionJS: f.f,
                  functionText: functionToString(f),
                  isLocal: !!f.fText
                });
              }
            });
        });
      }
    };
    getFunctions(
      "globals_",
      type,
      source ? [source, visibility] : [visibility]
    );
    if (source) {
      getFunctions(source, type, [visibility]);
    }
    getFunctions(visibility, type, []);
    return functions;
  };
  const accessor = name => getFunction(currentVisibility, "accessors", name);
  mergeFunctionsObjects(functionsObjects || []);
  return {
    mergeFunctionsObjects,
    mergeFunctionsArray,
    setUtils: utilsFunctions => (utils: utilsFunctions),
    setParams: parameters => (params = parameters),
    getFunction,
    getAccessorFunction,
    evalProtectedFunction,
    setFunction,
    setInitialFunction,
    composeFunction,
    removeFunction,
    getFunctionsArray,
    setVisibility: visibility => (currentVisibility = visibility),
    setSource: source => (currentSource = source)
  };
};
