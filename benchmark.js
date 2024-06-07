const chalk = require('chalk')
const Bufint = require('./dist/index.js').default

const w = process.stdout.getWindowSize()?.[0] ?? 0

function bench(fn, t = 100) {
    const startTime = performance.now(), endTime = startTime + t

    // loop
    let curTime, c = 0
    while ((curTime = performance.now()) < endTime) {
        fn()
        c++
    }

    // calculate speed
    const deltaTime = curTime - startTime
    const ops = 1000 * c / deltaTime

    // log output
    return { deltaTime, ops, c }
}

function benchNormal(desc, fn, t = 100) {
    const { ops } = bench(fn, t)
    const opsText = ops.toFixed(0).padEnd(9) + ' ops'
    const bar = '-'.repeat(Math.min(Math.round(ops / 500000), 30))
    
    console.log(desc.padEnd(w - 50) + ': ' + chalk.yellowBright(opsText) + ' ' + chalk.yellowBright(bar))
}

function benchEncoding(desc, bufint, value, t = 100) {
    const ser = bufint.serialize.bind(bufint, value)
    const buf = Buffer.concat([...ser()])
    const des = bufint.deserialize.bind(bufint, buf, 0)

    desc = desc.padEnd(w - 50)

    // encode
    {
        const { ops } = bench(() => [...ser()], t)
        const opsText = ops.toFixed(0).padEnd(9) + ' ops'
        const bar = '-'.repeat(Math.min(Math.round(ops / 500000), 30))
        
        console.log(desc + ': ' + chalk.cyanBright(opsText) + ' ' + chalk.redBright(bar))
    }
    // sync
    {
        const { ops } = bench(() => bufint.serializeSync(value, []), t)
        const opsText = ops.toFixed(0).padEnd(9) + ' ops'
        const bar = '-'.repeat(Math.min(Math.round(ops / 500000), 30))
        
        console.log(desc + ': ' + chalk.greenBright(opsText) + ' ' + chalk.greenBright(bar))
    }
    // decode
    {
        const { ops } = bench(des, t)
        const opsText = ops.toFixed(0).padEnd(9) + ' ops'
        const bar = '-'.repeat(Math.min(Math.round(ops / 800000), 30))
        
        console.log(desc + ': ' + chalk.magentaBright(opsText) + ' ' + chalk.gray(bar))
    }
}

function benchJSON(desc, value, t = 100) {
    const str = JSON.stringify(value)

    desc = desc.padEnd(w - 50)

    // stringify
    {
        const { ops } = bench(JSON.stringify.bind(0, value), t)
        const opsText = ops.toFixed(0).padEnd(9) + ' ops'
        const bar = '-'.repeat(Math.min(Math.round(ops / 500000), 30))
        
        console.log(desc + ': ' + chalk.cyanBright(opsText) + ' ' + chalk.redBright(bar))
    }
    // stringify
    {
        const { ops } = bench(JSON.parse.bind(0, str), t)
        const opsText = ops.toFixed(0).padEnd(9) + ' ops'
        const bar = '-'.repeat(Math.min(Math.round(ops / 800000), 30))
        
        console.log(desc + ': ' + chalk.magentaBright(opsText) + ' ' + chalk.gray(bar))
    }
}

const const_c = Bufint.Const.null_c
benchEncoding('const', const_c)

const objt = Bufint.Object({})
benchEncoding('Object (empty)', objt, {})

const bool = Bufint.Boolean
benchEncoding('Boolean', bool, true)

const opt = Bufint.Optional(Bufint.Boolean)
benchEncoding('Optional (undefined)', opt, undefined)
benchEncoding('Optional (boolean)', opt, true)

const optNull = Bufint.Optional.Nullable(Bufint.Boolean)
//benchEncoding('Optional (nullable, undefined)', optNull, undefined)
//benchEncoding('Optional (nullable, null)', optNull, null)
//benchEncoding('Optional (nullable, boolean)', optNull, true)

const sw = Bufint.Switch(
    v => v,
    [
        { case: 'a', bufint: Bufint.Const('a') },
        { case: 'b', bufint: Bufint.Const('b') },
        { case: 'c', bufint: Bufint.Const('b') },
    ],
    {bufint: Bufint.Const('unknown')},
    'uint8'
)
benchEncoding('Switch (string enum)', sw, 'a')

const enumt = Bufint.Enum([
    { value: 'a' },
    { value: 'b' },
    { value: 'c' },
    { value: 'd' },
], 'uint8')

benchEncoding('Enum (4)', enumt, 'a')

const objet = Bufint.Object({ hello: bool })
benchEncoding('Object (boolean)', objet, { hello: true })

const num = Bufint.Number.float64be
benchEncoding('Number (float64be)', num, 1)

const bitflags1 = Bufint.BitFlags(['a'])
benchEncoding('Bitflags (1bit)', bitflags1, { a: true })

const bf8keys = Array.from({ length: 8 }, (_, i) => '$' + i.toString(36))
const bitflags8 = Bufint.BitFlags(bf8keys)
benchEncoding('Bitflags (1byte)', bitflags8, Object.fromEntries(bf8keys.map(k => [k, Math.random() > 0.5]) ))

const bf32keys = Array.from({ length: 32 }, (_, i) => '$' + i.toString(36))
const bitflags32 = Bufint.BitFlags(bf32keys)
benchEncoding('Bitflags (4byte)', bitflags32, Object.fromEntries(bf32keys.map(k => [k, Math.random() > 0.5]) ))

const bitfield = Bufint.BitField([
    { key: 'a', bits: 2 },
    { key: 'b', bits: 4 },
    { key: 'c', bits: 3 },
    { key: 'd', bits: 1 },
])

benchEncoding('Bitfield (10bits)', bitfield, { a: 2, b: 11, c: 5, d: 1 })

const arr = Bufint.Array(Bufint.Boolean, 'uint32be')
benchEncoding('Array (0 bool)', arr, [])
benchEncoding('Array (1 bool)', arr, [true])
benchEncoding('Array (10000 bool)', arr, Array(10000).fill(true))

const buf16 = Bufint.Buffer('uint32be')
benchEncoding('Buffer (0)', buf16, Buffer.allocUnsafe(0))
benchEncoding('Buffer (10000)', buf16, Buffer.allocUnsafe(10000))

const str = Bufint.String('uint32be', 'utf8')
benchEncoding('String (100 utf8)', str, 'a'.repeat(100))
benchEncoding('String (10000 utf8)', str, 'a'.repeat(1000))

