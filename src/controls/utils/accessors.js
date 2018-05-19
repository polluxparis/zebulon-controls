import React from "react";
import * as utils from "./generic";

// import { utils } from "zebulon-controls";
// import {
// 	buildObject,
// 	exportFunctions
// 	// aggregations
// } from "./utils/utils";
// import { getFunction } from "./utils/compute.meta";
// ({row})=>accessor('qty')({row})*3
const sum = values => values.reduce((sum, value) => (sum += value), null);
export const accessors = {
	globals_: {
		formats: {
			decimals: ({ value, decimals, column }) =>
				utils.formatValue(
					value,
					null,
					decimals || (column || {}).decimals || 2
				),
			percentage: ({ value, decimals, column }) =>
				`${utils.formatValue(
					value * 100,
					null,
					decimals || (column || {}).decimals || 2
				)}%`,
			date: ({ value, format, column }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(
							value,
							format || (column || {}).format || "dd/mm/yyyy"
						),
			"mm/yyyy": ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "mm/yyyy"),
			yyyy: ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "yyyy"),
			time: ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "hh:mi:ss"),
			dateTime: ({ value }) =>
				utils.isNullOrUndefined(value)
					? ""
					: utils.formatValue(value, "dd/mm/yyyy hh:mi:ss"),
			image: ({ value }) => {
				if (!value) {
					return null;
				}
				return (
					<img
						height="100%"
						width="100%"
						padding="unset"
						alt=""
						src={value}
					/>
				);
			}
		},
		aggregations: {
			count: values => values.length,
			sum,
			min: values =>
				values.reduce(
					(min, value) =>
						(min = min === null || value < min ? value : min),
					null
				),
			max: values =>
				values.reduce(
					(max, value) =>
						(max = max === null || value > max ? value : max),
					null
				),
			avg: values =>
				values.length === 0 ? null : sum(values) / values.length,
			weighted_avg: values => {
				const wavg = values.reduce(
					(wavg, value) => {
						wavg.v0 += value.v0;
						wavg.v1 += value.v1;
						return wavg;
					},
					{ v0: null, v1: null }
				);
				return wavg.v0 === null && wavg.v1 === null
					? null
					: wavg.v0 / wavg.v1;
			},
			delta: values => {
				const delta = values.reduce(
					(delta, value) => {
						delta.v0 += value.v0;
						delta.v1 += value.v1;
						return delta;
					},
					{ v0: null, v1: null }
				);
				return delta.v0 - delta.v1;
			},
			prod: values =>
				values.reduce((prod, value) => (prod *= value), null)
		}
	}
};
// function forEachIntersection(accessor, intersection, data, callback) {
//   if (intersection && intersection.length > 0) {
//     // for (let i = 0; i < intersection.length; i += 1) {
//     //   const row=data[intersection[i]];
//     //   callback(accessor(row));
//     // }
//     intersection.map(index=>{const row =data[index];
//       if(!row.isFiltered){callback(accessor(row))};
//   }
// }

// export function calcVariance(accessor, intersection, data, population) {
//   let variance = 0;
//   let avg = null;
//   const len = intersection.length;
//   if (len > 0) {
//     if (population || len > 1) {
//       forEachIntersection(accessor, intersection, data, val => {
//         avg += val;
//       });
//       avg /= len;
//       forEachIntersection(accessor, intersection, data, val => {
//         variance += (val - avg) * (val - avg);
//       });
//       variance /= population ? len : len - 1;
//     } else {
//       variance = NaN;
//     }
//   }
//   return variance;
// }
