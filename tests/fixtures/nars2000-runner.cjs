#!/usr/bin/env node

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
    const request = JSON.parse(input);
    const respond = () => {
        if (request.code === 'FAIL') {
            process.stdout.write(JSON.stringify({ success: false, output: 'DOMAIN ERROR' }));
            return;
        }
        process.stdout.write(JSON.stringify({
            success: true,
            output: `nars:${request.protocolVersion}:${request.code}`
        }));
    };

    if (request.code === 'TIMEOUT') setTimeout(respond, 250);
    else respond();
});
