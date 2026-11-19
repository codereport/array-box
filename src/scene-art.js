const TAU = Math.PI * 2;

function drizzle(context, field, time, height) {
    context.lineWidth = 0.7;
    for (const item of field.motes) {
        const x = item.x + Math.sin(item.phase) * 12;
        const y = ((item.y + time * 68 * item.speed) % (height + 110)) - 60;
        const gradient = context.createLinearGradient(x, y, x, y + 65);
        gradient.addColorStop(0, '#dce9f000');
        gradient.addColorStop(0.8, '#dce9f0');
        gradient.addColorStop(1, '#dce9f000');
        context.strokeStyle = gradient;
        context.globalAlpha = 0.11;
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x - 1, y + 30, x - 4, y + 65);
        context.stroke();
    }
}

function leaves(context, field, time, width, height) {
    context.fillStyle = '#d7a264';
    for (const item of field.motes.slice(0, 25)) {
        const x = (item.x + time * item.speed * 5 + Math.sin(time * 0.2 + item.phase) * 35 + width) % width;
        const y = (item.y + time * item.speed * 12) % (height + 20) - 10;
        context.save();
        context.translate(x, y);
        context.rotate(item.phase + Math.sin(time * 0.2 + item.phase) * 0.6);
        context.globalAlpha = 0.20 + item.speed * 0.08;
        context.beginPath();
        context.ellipse(0, 0, 3, 7, 0, 0, TAU);
        context.fill();
        context.restore();
    }
}

export function paintSceneArt(context, field, scene, time, width, height) {
    context.save();
    if (scene.effect === 'drizzle') drizzle(context, field, time, height);
    if (['leaves', 'bamboo'].includes(scene.effect)) {
        leaves(context, field, time, width, height);
    }
    context.restore();
}
