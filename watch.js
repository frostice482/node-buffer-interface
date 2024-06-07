//@ts-check
require('esbuild').context({
    entryPoints: ['src/**/*'],
    outdir: 'dist',

    format: 'cjs',
    platform: 'node',
    
    tsconfig: 'tsconfig.json'
}).then(ctx => ctx.watch())
