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

            document.querySelector(
                '#playerLabels'
              ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`
            } else {
              document.querySelector(
                `div[data-id="${id}"]`
              ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`
        
              document
                .querySelector(`div[data-id="${id}"]`)
                .setAttribute('data-score', backEndPlayer.score)
        
              // sorts the players divs
              const parentDiv = document.querySelector('#playerLabels')
              const childDivs = Array.from(parentDiv.querySelectorAll('div'))
        
              childDivs.sort((a, b) => {
                const scoreA = Number(a.getAttribute('data-score'))
                const scoreB = Number(b.getAttribute('data-score'))
        
                return scoreB - scoreA
              })
        
              // removes old elements
              childDivs.forEach((div) => {
                parentDiv.removeChild(div)
              })
        
              // adds sorted elements
              childDivs.forEach((div) => {
                parentDiv.appendChild(div)
              })
        
              frontEndPlayers[id].target = {
                x: backEndPlayer.x,
                y: backEndPlayer.y
              }
        
             } else {
            if (id === socket.id) {

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
          const divToDelete = document.querySelector(`div[data-id="${id}"]`)
          divToDelete.parentNode.removeChild(divToDelete)
    
          if (id === socket.id) {
            document.querySelector('#usernameForm').style.display = 'block'
          }
    
          delete frontEndPlayers[id]
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

        if (frontEndPlayer.target) {
            frontEndPlayers[id].x +=
              (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
            frontEndPlayers[id].y +=
              (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
        }

        frontEndPlayer.draw()
    }

    for (const id in frontEndProjectiles) {
        const frontEndProjectile = frontEndProjectiles[id]
        frontEndProjectile.draw()
    }
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
        socket.emit('keydown', {keycode:'KeyW', sequenceNumber})
    }
    if (keys.a.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: -SPEED, dy: 0})
        socket.emit('keydown', {keycode:'KeyA', sequenceNumber})
    }
    if (keys.s.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: 0, dy: SPEED})
        socket.emit('keydown', {keycode:'KeyS', sequenceNumber})
    }
    if (keys.d.pressed) {
        sequenceNumber++
        playerInputs.push({sequenceNumber, dx: SPEED, dy: 0})
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

window.addEventListener('keyup', (event) => {
    if (!frontEndPlayers[socket.id]) return
  
    switch (event.code) {
      case 'KeyW':
        keys.w.pressed = false
        break
  
      case 'KeyA':
        keys.a.pressed = false
        break
  
      case 'KeyS':
        keys.s.pressed = false
        break
  
      case 'KeyD':
        keys.d.pressed = false
        break
    }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
    event.preventDefault()
    document.querySelector('#usernameForm').style.display = 'none'
    socket.emit('initGame', {
      width: canvas.width,
      height: canvas.height,
      devicePixelRatio,
      username: document.querySelector('#usernameInput').value
    })
})