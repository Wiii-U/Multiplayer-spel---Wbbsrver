const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const socket = io();

canvas.width = innerWidth;
canvas.height = innerHeight;

let animationId
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba()';
    c.fillRect(0,0,canvas.width, canvas.height);
}

animate();