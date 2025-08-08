const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = window.innerWidth;  // Set canvas width to full window width
   canvas.height = window.innerHeight; // Set canvas height to full window height
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
let  isGame=true;
let  isPause=false;
let score=0;
let HI=0;
let enemies=[];
const bufferedKeysList = ['z', 'x', 'c','ArrowUp','d'];
let keys = {};
let enemyAnimations = {};
let bufferedKeys = {}; // Timers for buffered keys
// Listen for the 'keydown' event to detect when a key is pressed
document.addEventListener('keydown', function(event) {
  const key = event.key;
  keys[event.key] = true;// Store the key as pressed

  if (key == 'Escape') {
    isPause = !isPause;
  }

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
    if(!this.dead && !isPause){
      this.movements();
    }
    else{
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
flyImg.src='./Demon/Sprites/with_outline/FLYING.png';
deathImg.src='./Demon/Sprites/with_outline/DEATH.png';
hurtImg.src='./Demon/Sprites/with_outline/HURT.png';
idleImg.src='./Demon/Sprites/with_outline/IDLE.png';
attackImg.src='./Demon/Sprites/with_outline/ATTACK.png';
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
      
  constructor(x,y,health,animations,frameWidth,frameHeight,scale=1){
    super(x,y,animations,frameWidth,frameHeight,scale);this.currentAnim='flying';this.maxHealth=health;
    this.angle=0;
    this.speed=4;
    this.frq=0.02;
    this.amplitude=100;
    this.chaseRange=canvas.width;
    this.verticalChaseRange=canvas.height;
    this.attackRange=50;
    this.isChasing=false;
    this.health=this.maxHealth;
  }
  update(deltaTime,player){
    super.update(deltaTime);
    if(!this.dead && !isPause){
      this.chase(player);
    }else{
      if(this.frameIndex>=this.animations.death.frames-1){
        this.x=-100;
      }
    }
  }

  chase(player){
    if(isPause){return;}
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

function spawnEnemy(health){
  const enemy=new Enemy(canvas.width*Math.random(),canvas.height*0.3,health,enemyAnimations,81,71,2);
  enemies.push(enemy);
}

function collide(a,b){
  const centre1 = a.circle;
  const centre2 = b.circle;
  
  const dx = centre1.x - centre2.x;
  const dy = centre1.y - centre2.y;
  const distanceSquared = dx * dx + dy * dy;
  if(a.isCrouch && a.isGrounded &&(!keys['x'] && !keys['c']) && (dx>2 && Math.abs(dy)>2)){
    return false;
  }
      
  const combinedRadius = centre1.radius + centre2.radius;
  const combinedRadiusSquared = combinedRadius * combinedRadius;

  return distanceSquared <= combinedRadiusSquared;
}

const waves = {
  wave0:{ no: 0, enemyCount: 0, isFinished: false, next: 'wave1',eHealth:300 ,damage:200},
  wave1: { no: 1, enemyCount: 5, isFinished: false, next: 'wave2',eHealth:300 ,damage:200},
  wave2: { no: 2, enemyCount: Math.pow(3, 2), isFinished: false, next: 'wave3',eHealth:800, damage:200 },
  wave3: { no: 3, enemyCount: Math.pow(3, 3), isFinished: false, next: 'wave4', eHealth:1300 ,damage:300},
  wave4: { no: 4, enemyCount: Math.pow(3, 4), isFinished: false, next: 'wave5' , eHealth:2000, damage:500},
  wave5: { no: 5, enemyCount: Math.pow(3, 5), isFinished: false, next: 'wave6',eHealth:2300 ,damage:500},
  wave6: { no: 6, enemyCount: Math.pow(3, 6), isFinished: false, next: 'wave7',eHealth:2800, damage:800 },
  wave7: { no: 7, enemyCount: Math.pow(3, 7), isFinished: false, next: 'wave8', eHealth:3300 ,damage:800},
  wave8: { no: 8, enemyCount: Math.pow(3, 8), isFinished: false, next: 'wave9' , eHealth:4000, damage:1000},
  wave9: { no: 9, enemyCount: Math.pow(3, 9), isFinished: false, next: 'wave10',eHealth:4300 ,damage:1000},
  wave10: { no: 10, enemyCount: Math.pow(3, 10), isFinished: false, next: 'wave11',eHealth:4800, damage:1100 },
  wave11: { no: 11, enemyCount: Math.pow(3, 11), isFinished: false, next: 'wave12', eHealth:5300 ,damage:1200},
  wave12: { no: 12, enemyCount: Math.pow(3, 12), isFinished: false, next: null , eHealth:6000, damage:1500},
};

let curWave='wave0';
let waveAnnounced = false;
let announcementText = '';
let announcementTimer = 0;

 // Load images for each animation
const walkImage = new Image();
walkImage.src = './FreeKnight_v1/_Run.png';
const idleImage = new Image();
idleImage.src = './FreeKnight_v1/_Idle.png';
const slideImage=new Image();
slideImage.src='./FreeKnight_v1/_SlideFull.png';
const attackImage=new Image();
attackImage.src='./FreeKnight_v1/_Attack.png';
const attack2Image=new Image();
attack2Image.src='./FreeKnight_v1/_Attack2.png';
const crouchAttackImage=new Image();
crouchAttackImage.src='./FreeKnight_v1/_CrouchAttack.png';
const crouchImage=new Image();
crouchImage.src='./FreeKnight_v1/_Crouch.png';
const comboImage=new Image();
comboImage.src='./FreeKnight_v1/_AttackCombo2hit.png';
const dashImage=new Image();
dashImage.src='./FreeKnight_v1/_Dash.png';
const deathImage=new Image();
deathImage.src='./FreeKnight_v1/_Death.png';
const hitImage=new Image();
hitImage.src='./FreeKnight_v1/_Hit.png';
const jumpImage=new Image();
jumpImage.src='./FreeKnight_v1/_Jump.png';
const fallImage=new Image();
fallImage.src='./FreeKnight_v1/_JumpFallInBetween.png';

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

    class PreLoader{
      constructor(src,onComplete){
        this.video=document.createElement('video');
        this.video.src=src;
        this.video.muted=true;
        this.video.preload='auto';
        this.video.playsInline=true;
        this.state='intro';
        this.onComplete=onComplete;

        this.video.addEventListener('canplay',()=>{
          this.video.play();
          this.drawloop();
        });

        this.video.addEventListener('timeupdate',()=>{
          if(this.state=='intro' && this.video.currentTime>=3){
            this.video.pause();
            this.state='wait';
          }
  
          if(this.state=='outro' && this.video.currentTime>=5){
            this.state='done';
            this.video.pause();
            this.onComplete();
          }
        });
        document.addEventListener('keydown', (e) => {
          if (e.key == 'Enter' && this.state == 'wait') {
            this.state = 'outro';
            this.video.currentTime = 3;
            this.video.play();
          }
        });

      }

      drawloop(){
        if(this.state=='done')return;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(this.video,0,0,canvas.width,canvas.height);
        requestAnimationFrame(() => this.drawloop());
      }
    }

 
    const ply1 = new Player(canvas.width/2,canvas.height*0.7, animations, 120, 80,2); 
    let waveKills=0;
    let lastTime = 0;

    const preloader=new PreLoader('preloader.mp4',()=>{requestAnimationFrame(gameLoop);});

    // Animation loop
    function gameLoop(timestamp) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if(isPause){
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "60px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);

        ctx.font = "30px Arial";
        ctx.fillText("Press 'ESC' to Resume", canvas.width / 2, canvas.height / 2 + 50);
        requestAnimationFrame(gameLoop);
        return;
      }

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
              enemy.health -= Math.floor(waves[curWave].damage/16);score+=Math.floor(waves[curWave].damage/32);
            }else if(collide(ply1,enemy) && (ply1.currentAnim!='dash')){
              ply1.health-=100/16;
            }
          }
          enemy.update(deltaTime,ply1);
          enemy.draw(ctx);

          if (enemy.health <= 0 && !enemy.dead) {
            enemy.setAnimation('death');
            enemy.dead = true;
            waveKills++;
            console.log(`Wave kills= ${waveKills}`);
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
          if(curWave!='wave12'){ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);}
          else{
            ctx.fillStyle = "green";
            ctx.textAlign = "center";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2);
          }
          if(score>HI){
            HI=score;
          }
          score=0;
          if(keys['r']){
            console.clear();
            isGame = true;
            ply1.dead = false;
            waveKills=0;  
            waveAnnounced=false;
            for(let i=0;i<12;i++){
              waves[`wave${i}`].isFinished=false;
            }
            ply1.health = 10000; // Reset health
            ply1.x = canvas.width / 2; // Reset position
            curWave='wave0';//Reset Wave
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
          if(announcementText=='Victory' && isGame){
           isGame=false;
          }
          waveAnnounced = false;
          announcementText = '';
        
        }
      }
      requestAnimationFrame(gameLoop);
    }

    
    setInterval(() => {

      if(isPause && !isGame) {
        return;
      }

      const currentWave = waves[curWave];
      if (enemies.length < Math.pow(5, waves[curWave].no) && !isPause) {
        spawnEnemy(waves[curWave].eHealth);
      }

      if (!currentWave.isFinished && waveKills>=waves[curWave].enemyCount) {
        currentWave.isFinished = true;
        if (currentWave.next) {
          curWave = currentWave.next;
          waveKills=0;
          //Heal
          if(waves[curWave].no %2==0){
            ply1.health+=4000;
            if(ply1.health>ply1.maxHealth) ply1.health=ply1.maxHealth;
            console.log("Healed "+4000+"HP");
          }
          console.log("Damage:"+waves[curWave].damage);
          // Show wave announcement
          waveAnnounced = true;
          announcementText = `Wave ${waves[curWave].no}`;
          announcementTimer = 120; 
        }else{
          waveAnnounced = true;
          announcementText = 'Victory';
          announcementTimer = 1000;
        }
      }
    }, 2000);   
        
  };
};
