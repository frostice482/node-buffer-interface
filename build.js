//@ts-check

const esbuild = require('esbuild')
const fsp = require('fs/promises')

;(async() => {
    await fsp.rm('dist', { recursive: true, force: true })

    await esbuild.build({
        entryPoints: ['src/**/*'],
        outdir: 'dist',
    
        format: 'cjs',
        platform: 'node',
        //bundle: true,
        //minify: true,

        loader: {
            '.mjs': 'copy',
            '.cjs': 'copy'
        },
    
        tsconfig: 'tsconfig.json',
        packages: 'external'
    })    
})()
