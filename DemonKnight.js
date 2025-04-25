const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = window.innerWidth;  // Set canvas width to full window width
   canvas.height = window.innerHeight; // Set canvas height to full window height
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
let  isGame=true;
let score=0;
let HI=0;
const enemies=[]
const bufferedKeysList = ['z', 'x', 'c','ArrowUp','d'];
let keys = {};
let enemyAnimations = {};
let bufferedKeys = {}; // Timers for buffered keys
// Listen for the 'keydown' event to detect when a key is pressed
document.addEventListener('keydown', function(event) {
  const key = event.key;
  keys[event.key] = true;  // Store the key as pressed
  if (bufferedKeys[key]) {
    clearTimeout(bufferedKeys[key]);
    delete bufferedKeys[key];
  }
});

// Listen for the 'keyup' event to detect when a key is released
document.addEventListener('keyup', function(event) {
  const key = event.key;
  if (bufferedKeysList.includes(key)) {
  // Delay turning the key "off"
    if(key=='c'){
      bufferedKeys[key] = setTimeout(() => {
      keys[key] = false;
      delete bufferedKeys[key];
    }, 350); // Hold key active for 300ms after release
    }else{
      bufferedKeys[key] = setTimeout(() => {
      keys[key] = false;
      delete bufferedKeys[key];
    }, 250); // Hold key active for 300ms after release
    }
    } else {
      keys[key] = false;
    }
});
class Character {
  constructor(x, y, animations, frameWidth, frameHeight,scale=1) {
    this.x = x;
    this.y = y;
    this.scale=scale;
    this.animations = animations;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.currentAnim = 'idle'; // Default to 'idle'
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 30; // Frame switch interval (ms)
    this.circle = {
      x: this.x + this.frameWidth * this.scale / 2,
      y: this.y + this.frameHeight * this.scale / 2,
      radius: Math.min(this.frameWidth, this.frameHeight) * this.scale * 0.4
    };
    this.dead=false;
  }

  setAnimation(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(deltaTime) {
    this.frameTimer += deltaTime;
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.animations[this.currentAnim].frames;
    }
    this.circle.x = this.x + this.frameWidth * this.scale / 2;
    this.circle.y = this.y + this.frameHeight * this.scale / 2;
  }

  draw(ctx) {
    const anim = this.animations[this.currentAnim];
    const sx = this.frameIndex * this.frameWidth;
    const sy = 0; // Single row, so sy is always 0

    ctx.drawImage(
      anim.image, 
      sx, sy, this.frameWidth, this.frameHeight,
      this.x, this.y, this.frameWidth*this.scale, this.frameHeight*this.scale
    );
  }
}

class Player extends Character{
  speed=10;
  constructor(x, y, animations, frameWidth, frameHeight,scale=1){
    super(x,y,animations,frameWidth,frameHeight,scale);this.isCrouch=false;this.isAttack=false;this.health=10000;
    this.gravity=12;this.speedY=20;this.isGrounded=true;this.jumpCount=0;this.maxJumps=2;this.defaultY=y;
    this.maxHealth=10000;this.direction='right';
  }
  update(deltaTime){
    super.update(deltaTime);
    if(!this.dead){
      this.movements();
    }else{
      if(this.frameIndex>=this.animations.death.frames-1){
        isGame=false;
      }
    }
  }
  movements(){
    if(!keys['Control']){
      this.isCrouch=false;
    }
    if(!keys['x'] && !keys['z'] && !keys['c']){
      this.isAttack=false;
    }

    if(keys['d'] && !this.isCrouch){
      this.setAnimation('dash');this.isAttack=true;
      if(this.x<(canvas.width*(1-0.05)-this.frameWidth)){this.x+=this.speed*5;}
    }

    if(keys['ArrowUp']){
      if((this.y>0) && (this.jumpCount<this.maxJumps)){
        this.setAnimation('jump');this.y-=this.speedY*0.8;this.jumpCount+=1.2/16;
        if(this.isGrounded){
          this.isGrounded=false;
        }
      }else{
        keys['ArrowUp']=false;
      }
    }
    if((!keys['ArrowUp'] && !this.isGrounded) || this.jumpCount==this.maxJumps ){
      this.setAnimation('fall');
      if(this.y<this.defaultY){
        this.y+=this.gravity*1.5;
      }
      else{
        this.setAnimation('idle');this.isGrounded=true;this.jumpCount=0;  
      } 
    }

    if((keys['Control'] && keys['ArrowRight']) && (this.x<canvas.width - this.frameWidth) && this.isGrounded){
      this.x+=this.speed*1.5;
      this.setAnimation('slide');this.isCrouch=true;
    }else if((keys['ArrowRight']) && (this.x<canvas.width - this.frameWidth)){
      this.x+=this.speed;
      this.setAnimation('walk');
    }else if((keys['ArrowLeft']) && (this.x>0)){
      this.x-=this.speed*2;
      this.setAnimation('dash');
    }else if(keys['z'] && keys['Control'] && this.isGrounded){
      this.setAnimation('crouchAttack');this.isCrouch=true;this.isAttack=true;
    }else if(keys['z']){
      this.setAnimation('attack');this.isAttack=true;
    }else if(keys['x']){
      this.setAnimation('attack2');this.isAttack=true;
    }else if(keys['c']){
      this.setAnimation('combo');this.isAttack=true;
    }else if(keys['Control'] && this.isGrounded){
      this.setAnimation('crouch');this.isCrouch=true;
    }else{
      this.setAnimation('idle');
    }
  }

}
const flyImg=new Image();
const deathImg=new Image();
const hurtImg=new Image();
const attackImg=new Image();
const idleImg=new Image(); 
flyImg.src='./Demon/Sprites/with_outline/FLYING.PNG';
deathImg.src='./Demon/Sprites/with_outline/DEATH.PNG';
hurtImg.src='./Demon/Sprites/with_outline/HURT.PNG';
idleImg.src='./Demon/Sprites/with_outline/IDLE.PNG';
attackImg.src='./Demon/Sprites/with_outline/ATTACK.PNG';
flyImg.onload = () => {
  enemyAnimations = {
    flying: { image: flyImg, frames: 4 },
    death: { image: deathImg, frames: 6 },
    hurt: { image: hurtImg, frames: 4 },
    idle: { image: idleImg, frames: 4 },
    attack: { image: attackImg, frames: 8 }
  };
};

class Enemy extends Character{
      
  constructor(x,y,animations,frameWidth,frameHeight,scale=1){
    super(x,y,animations,frameWidth,frameHeight,scale);this.currentAnim='flying';this.health=100;
    this.angle=0;
    this.speed=4;
    this.frq=0.02;
    this.amplitude=100;
    this.chaseRange=canvas.width;
    this.verticalChaseRange=canvas.height;
    this.attackRange=50;
    this.isChasing=false;
    this.maxHealth=100;
  }
  update(deltaTime,player){
    super.update(deltaTime);
    if(!this.dead){
      this.chase(player);
    }else{
      if(this.frameIndex>=this.animations.death.frames-1){
        this.x=-100;
      }
    }
  }

  chase(player){
    const dx=Math.abs(this.x-player.x);const dy=Math.abs(this.y-player.y);
    if(dx<this.chaseRange && dy<this.verticalChaseRange){
      this.isChasing=true;
      if(this.x<player.x){
        this.x+=this.speed;
      }else if(this.x>player.x){
        this.x-=this.speed;
      }

      if(this.y<player.y){
        this.y+=this.speed;
      }else if(this.y>player.y){
        this.y-=this.speed;
      }
    }else{
      this.isChasing=false;
    }
  }
}

function spawnEnemy(){
  const enemy=new Enemy(canvas.width*Math.random(),canvas.height*0.3,enemyAnimations,81,71,2);
  enemies.push(enemy);
}

function collide(a,b){
  const centre1 = a.circle;
  const centre2 = b.circle;
  
  const dx = centre1.x - centre2.x;
  const dy = centre1.y - centre2.y;
  const distanceSquared = dx * dx + dy * dy;
  if(a.isCrouch && a.isGrounded &&(!keys['x'] && !keys['c']) && (dx>2||dy>=2||dy<2)){
    return false;
  }
      
  const combinedRadius = centre1.radius + centre2.radius;
  const combinedRadiusSquared = combinedRadius * combinedRadius;

  return distanceSquared <= combinedRadiusSquared;
}
 
const waves = {
  wave1: { no: 1, enemyCount: 5, isFinished: false, next: 'wave2' },
  wave2: { no: 2, enemyCount: Math.pow(5, 2), isFinished: false, next: 'wave3' },
  wave3: { no: 3, enemyCount: Math.pow(5, 3), isFinished: false, next: 'wave4' },
  wave4: { no: 4, enemyCount: Math.pow(5, 4), isFinished: false, next: null },
};

let curWave='wave1';
let waveAnnounced = false;
let announcementText = '';
let announcementTimer = 0;

 // Load images for each animation
const walkImage = new Image();
walkImage.src = './FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Run.PNG';
const idleImage = new Image();
idleImage.src = './FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Idle.PNG';
const slideImage=new Image();
slideImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_SlideFull.PNG';
const attackImage=new Image();
attackImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Attack.PNG';
const attack2Image=new Image();
attack2Image.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Attack2.PNG';
const crouchAttackImage=new Image();
crouchAttackImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_CrouchAttack.PNG';
const crouchImage=new Image();
crouchImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Crouch.PNG';
const comboImage=new Image();
comboImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_AttackCombo2hit.PNG';
const dashImage=new Image();
dashImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Dash.PNG';
const deathImage=new Image();
deathImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Death.PNG';
const hitImage=new Image();
hitImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Hit.PNG';
const jumpImage=new Image();
jumpImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_Jump.PNG';
const fallImage=new Image();
fallImage.src='./FreeKnight_v1/Colour1/Outline/120x80_PNGSheets/_JumpFallInBetween.PNG';

walkImage.onload = () => {
  idleImage.onload = () => {
    const animations = {
      walk: { image: walkImage, frames: 10 },
      idle: { image: idleImage, frames: 10 }, 
      slide: { image: slideImage, frames: 4},
      attack: { image: attackImage, frames: 4 },
      attack2: { image: attack2Image, frames: 6},
      crouchAttack: { image: crouchAttackImage, frames: 4},
      crouch: { image: crouchImage, frames:1},
      combo: {image: comboImage,frames: 10},
      dash:{image: dashImage, frames: 2},
      death:{image:deathImage ,frames: 10},
      hit:{image: hitImage, frames: 1},
      jump:{image: jumpImage, frames: 3},
      fall:{image: fallImage, frames: 2}
    };

    const ply1 = new Player(canvas.width/2,canvas.height*0.7, animations, 120, 80,2); 
                      
    // Animation loop
    function gameLoop(timestamp) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      if(isGame){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "cyan";
        ctx.fillText("Score: "+score,100,50);
        ctx.fillText("HI: "+HI,350,50);
        ctx.fillStyle = "red";
        ctx.fillRect(100, 80, 400, 20);
        ctx.fillStyle = "orange";
        ctx.fillRect(100, 80, 400 * (ply1.health / ply1.maxHealth), 20);
        ctx.strokeStyle = "black";
        ctx.strokeRect(100, 80, 400, 20);
        ply1.update(deltaTime);
        ply1.draw(ctx);
        if(!ply1.dead){
          for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].x + enemies[i].frameWidth < 0) {
              enemies.splice(i, 1);
            }
          }
          enemies.forEach(((enemy,i)=>{
          const distanceX = Math.abs(ply1.x - enemy.x);
          const distanceY = Math.abs(ply1.y - enemy.y);
          const distanceThreshold = 200; 

          if (distanceX < distanceThreshold && distanceY < distanceThreshold) {
            if (collide(ply1, enemy) && ply1.isAttack || ply1.currentAnim=='crouchAttack') {
              enemy.health -= Math.floor(200/16);score+=Math.floor(100/16);
            }else if(collide(ply1,enemy) && (ply1.currentAnim!='dash')){
              ply1.health-=10;ply1.setAnimation('hit');
            }
          }
          enemy.update(deltaTime,ply1);
          enemy.draw(ctx);

          if (enemy.health <= 0 && !enemy.dead) {
            enemy.setAnimation('death');
            enemy.dead = true;
          }

          if(!enemy.dead){
            ctx.fillStyle='red';
            ctx.fillRect(enemy.x,enemy.y+enemy.frameHeight/2,enemy.frameWidth*(enemy.health/enemy.maxHealth),10);
            ctx.strokeStyle = "black";
            ctx.strokeRect(enemy.x,enemy.y+enemy.frameHeight/2,enemy.frameWidth,10);
            ctx.fillStyle='yellow';
            ctx.font='18px Arial';
            ctx.fillText(enemy.health,enemy.x+enemy.frameWidth/2,enemy.y+enemy.frameHeight/2);
          }

          if(ply1.health<=0 && !ply1.dead){
            if(ply1.y!=ply1.defaultY){
              ply1.y=ply1.defaultY;
            }
            ply1.setAnimation('death');ply1.dead=true;
          }
              
          }));

        }
        }else{
        ctx.font = "50px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        if(score>HI){
          HI=score;
        }
        score=0;
        if(keys['r']){
          isGame = true;
          ply1.dead = false;  
          ply1.health = 10000; // Reset health
          ply1.x = canvas.width / 2; // Reset position
          curWave='wave1';//Reset Wave
          // Reset the enemies array
          enemies.splice(0, enemies.length);
        }

      }
          
      if (waveAnnounced && isGame) {
        ctx.font = "48px Arial";
        ctx.fillStyle = "orange";
        ctx.textAlign = "center";
        ctx.fillText(announcementText, canvas.width / 2, canvas.height / 2);
        announcementTimer--;
        if (announcementTimer <= 0) {
          waveAnnounced = false;
          announcementText = '';
        }
      }

      requestAnimationFrame(gameLoop);
    }

    let lastTime = 0;
    requestAnimationFrame(gameLoop);
    setInterval(() => {
      const currentWave = waves[curWave];
      if (enemies.length < Math.pow(5, waves[curWave].no)) {
        spawnEnemy();
      }

      if (!currentWave.isFinished && enemies.length >= currentWave.enemyCount) {
        currentWave.isFinished = true;
        if (currentWave.next) {
          curWave = currentWave.next;

          // Show wave announcement
          waveAnnounced = true;
          announcementText = `Wave ${waves[curWave].no}`;
          announcementTimer = 120; 
        }
      }
    }, 2000);   
        
  };
};
