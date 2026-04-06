import { createRequire } from 'module'
import type BetterSqlite3Constructor from 'better-sqlite3'

const require = createRequire(import.meta.url)
const BetterSqlite3 = require('better-sqlite3') as typeof BetterSqlite3Constructor

export default BetterSqlite3
