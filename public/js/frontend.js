const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const socket = io();

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('connect', () => {
    socket.emit('initCanvas', {width: canvas.width, height: canvas.height})
})

socket.on('updateProjectiles', (backEndProjectiles) => {
    for (const id in backEndProjectiles) {
        const backEndProjectile = backEndProjectiles[id]

        if (!frontEndProjectiles[id]) {
            frontEndProjectiles[id] = new Projectile({  
                x: backEndProjectile.x,
                y: backEndProjectile.y, 
                radius: 5, 
                color: frontEndPlayers[backEndProjectile.playerId]?.color, 
                velocity: backEndProjectile.velocity
            })
        } else {
            frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
            frontEndProjectiles[id].x += backEndProjectiles[id].velocity.y
        }
    }

    for (const frontEndProjectileId in frontEndProjectiles) {
        if (!backEndProjectiles[frontEndProjectileId]) {
            delete frontEndProjectiles[frontEndProjectileId]
        }
    }
})

socket.on('updatePlayers', (backEndPlayers) => {
    for (const id in backEndPlayers) {
        const backEndPlayer = backEndPlayers[id]

        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player({
                x: backEndPlayer.x, 
                y: backEndPlayer.y, 
                radius: 10,
                color: backEndPlayer.color
            })

            document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}">${id}: 0</div>`
        } else {
            if (id === socket.id) {
                frontEndPlayers[id].x = backEndPlayer.x
                frontEndPlayers[id].y = backEndPlayer.y

                const lastBackendInputIndex = playerInputs.findIndex((input) => {
                    return backEndPlayer.sequenceNumber === input.sequenceNumber
                })

                if (lastBackendInputIndex > -1) {
                    playerInputs.splice(0, lastBackendInputIndex + 1)
                }
                playerInputs.forEach((input) => {
                    frontEndPlayers[id].x += input.dx
                    frontEndPlayers[id].y += input.dy
                })
            } else {

                gsap.to(frontEndPlayers[id], {
                    x: backEndPlayer.x,
                    y: backEndPlayer.y,
                    duration: 0.015,
                    ease: "linear"
                })
            }
        }
    }

    for (const id in frontEndPlayers) {
        if (!backEndPlayers[id]) {
            delete frontEndPlayers[id]

            const divToDelete = document.querySelector(`div[data-id="${id}"]`)
            divToDelete.parentNode.removeChild(divToDelete)
        }
    }
})

let animationId
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    for (const id in frontEndPlayers) {
        const frontEndPlayer = frontEndPlayers[id]
        frontEndPlayer.draw()
    }

    for (const id in frontEndProjectiles) {
        const frontEndProjectile = frontEndProjectiles[id]
        frontEndProjectile.draw()
    }

    // for (let i = frontEndProjectiles.length; i >= 0; i--) {
    //     const frontEndProjectile = frontEndProjectiles[i]
    //     frontEndProjectile.update()
    // }
}

animate();

const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

const SPEED = 10
const playerInputs = []
let sequenceNumber = 0
setInterval(() => {
    if (keys.w.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: 0, dy: -SPEED})
        frontEndPlayers[socket.id].y -= SPEED
        socket.emit('keydown', {keycode:'KeyW', sequenceNumber})
    }
    if (keys.a.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: -SPEED, dy: 0})
        frontEndPlayers[socket.id].x -= SPEED
        socket.emit('keydown', {keycode:'KeyA', sequenceNumber})
    }
    if (keys.s.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: 0, dy: SPEED})
        frontEndPlayers[socket.id].y += SPEED
        socket.emit('keydown', {keycode:'KeyS', sequenceNumber})
    }
    if (keys.d.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: SPEED, dy: 0})
        frontEndPlayers[socket.id].x += SPEED
        socket.emit('keydown', {keycode:'KeyD', sequenceNumber})
    }
}, 15)

window.addEventListener('keydown', (event) => {
    if (!frontEndPlayers[socket.id]) return

    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = true
            break
        case 'KeyA':
            keys.a.pressed = true
            break
        case 'KeyD':
            keys.d.pressed = true
            break
        case 'KeyS':
            keys.s.pressed = true
            break
    }
})