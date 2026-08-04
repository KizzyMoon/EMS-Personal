[1mdiff --git a/ems-dashboard.js b/ems-dashboard.js[m
[1mindex d49f148..878f735 100644[m
[1m--- a/ems-dashboard.js[m
[1m+++ b/ems-dashboard.js[m
[36m@@ -1414,8 +1414,24 @@[m [mfunction trainingSignups(rows, employeeColumn, nameColumn, startRow, endRow, sec[m
   return people;[m
 }[m
 [m
[32m+[m[32mfunction findTrainingHeaderDate(rows, config) {[m
[32m+[m[32m  const startRow = 8;[m
[32m+[m[32m  const endRow = 12;[m
[32m+[m[32m  const startColumn = Math.max(1, config.employeeColumn);[m
[32m+[m[32m  const endColumn = Math.max(config.timeColumn, config.nameColumn);[m
[32m+[m
[32m+[m[32m  for (let row = startRow; row <= endRow; row += 1) {[m
[32m+[m[32m    for (let column = startColumn; column <= endColumn; column += 1) {[m
[32m+[m[32m      const date = parseTrainingDate(trainingRawCell(rows, row, column));[m
[32m+[m[32m      if (date) return date;[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  return "";[m
[32m+[m[32m}[m
[32m+[m
 function parseTrainingSession(rows, config) {[m
[31m-  const date = parseTrainingDate(trainingRawCell(rows, 11, config.nameColumn));[m
[32m+[m[32m  const date = findTrainingHeaderDate(rows, config);[m
   const cadets = trainingSignups(rows, config.employeeColumn, config.nameColumn, 13, 26, "cadet");[m
   const staff = trainingSignups(rows, config.employeeColumn, config.nameColumn, 29, 55, "staff");[m
   const myEmployeeNumber = normalizeEmployeeNumber(state.settings?.myEmployeeNumber);[m
