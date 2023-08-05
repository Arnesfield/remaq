/**
 * Taken from [node-postgres](https://github.com/brianc/node-postgres) `escapeIdentifier`.
 * @param str The value to escape.
 * @returns The escaped string.
 */
export function escapeIdentifier(str: string): string {
  return '"' + str.replace(/"/g, '""') + '"';
}

/**
 * Taken from [node-postgres](https://github.com/brianc/node-postgres) `escapeLiteral`.
 * @param str The value to escape.
 * @returns The escaped string.
 */
export function escapeLiteral(str: string): string {
  let hasBackslash = false;
  let escaped = "'";
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'") {
      escaped += c + c;
    } else if (c === '\\') {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }
  escaped += "'";
  if (hasBackslash === true) {
    escaped = ' E' + escaped;
  }
  return escaped;
}
