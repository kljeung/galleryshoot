// Game.js
"use strict";

class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    preload() {
        this.load.setPath('assets/');
        this.load.image('carFront', 'carFront.png');
        this.load.image('carBack', 'carBack.png');
        this.load.image('burger', 'burger.png');
        this.load.image('enemy1', 'enemy1.png');
        this.load.image('enemy2', 'enemy2.png');
        this.load.image('enemy3', 'enemy3.png');
        this.load.image('wrench', 'wrench.png');
        this.load.image('phone', 'phone.png');
        this.load.audio('hurt', 'hurt.ogg');
        this.load.audio('bulletNoise', 'bulletNoise.ogg');
    }

    create() {
        this.initGame();
    }

    initGame() {
        this.projectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyProjectiles = this.physics.add.group();
        this.healthItems = this.physics.add.group();
        this.enemyData = [];
        this.lastFired = 0;
        this.victoryTriggered = false;

        if (!this.scene.isActive('galleryShoot')) {
            this.scene.launch('galleryShoot');
        } else {
            this.scene.get('galleryShoot').events.emit('restart-background');
        }
        this.scene.bringToTop();

        const galleryScene = this.scene.get('galleryShoot');
        if (galleryScene && Array.isArray(galleryScene.layersA) && Array.isArray(galleryScene.layersB)) {
            galleryScene.scrollActive = true;
            for (let layer of [...galleryScene.layersA, ...galleryScene.layersB]) {
                layer.setVisible(true);
                layer.alpha = 1;
            }
        }

        this.registry.set('score', 0);
        this.registry.set('health', 3);

        const x = 320;
        const y = 1100;
        this.player = this.add.container(x, y);
        this.carBack = this.add.image(0, 25, 'carBack').setScale(2.5).setRotation(Math.PI);
        this.carFront = this.add.image(0, -15, 'carFront').setScale(2.5).setRotation(Math.PI);
        this.player.add([this.carBack, this.carFront]);

        this.physics.world.enable(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(50, 100).setOffset(-25, -50);

        this.enemyEvent = this.time.addEvent({ delay: 1500, callback: this.spawnEnemy, callbackScope: this, loop: true });
        this.phoneEvent = this.time.addEvent({ delay: 3000, callback: this.enemyThrowPhone, callbackScope: this, loop: true });
        this.wrenchEvent = this.time.addEvent({ delay: 7000, callback: this.spawnWrench, callbackScope: this, loop: true });

        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.hurtSound = this.sound.add('hurt');
        this.bulletSound = this.sound.add('bulletNoise');

        this.scoreText = this.add.text(35, 20, 'Score: 0', { fontSize: '18px', fill: '#fff' });

        this.healthIcons = this.add.group();
        for (let i = 0; i < this.registry.get('health'); i++) {
            const icon = this.add.image(50 + i * 25, 65, 'wrench').setScale(0.4);
            this.healthIcons.add(icon);
        }

        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemyProjectiles, this.hitByPhone, null, this);
        this.physics.add.overlap(this.player, this.healthItems, this.collectWrench, null, this);
    }

    update(time) {
        if (!this.player || !this.player.body) return;

        this.player.body.setVelocityX(0);
        if (this.aKey.isDown) this.player.body.setVelocityX(-200);
        if (this.dKey.isDown) this.player.body.setVelocityX(200);

        if (this.spaceKey.isDown && time > this.lastFired) {
            let bullet = this.projectiles.create(this.player.x, this.player.y - 50, 'burger');
            bullet.setScale(1.5);
            bullet.setVelocityY(-300);
            this.bulletSound.play();
            this.lastFired = time + 300;
        }

        this.projectiles.children.each(b => { if (b.y < 0) b.destroy(); });
        this.enemyProjectiles.children.each(p => { if (p.y > 1300) p.destroy(); });
        this.healthItems.children.each(h => { if (h.y > 1300) h.destroy(); });

        for (let data of this.enemyData) {
            let e = data.sprite;
            if (!data.retreating && e && e.body) {
                const gatherThreshold = 15;
                let targetX = 320 + data.offset;
                let targetY = 300 + data.offsetY;
                let dx = targetX - e.x;
                let dy = targetY - e.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (!data.gathered && dist < gatherThreshold) {
                    e.body.setVelocity(0);
                    data.gathered = true;
                }
                if (!data.gathered && e.body) {
                    e.body.setVelocity(dx / dist * 100, dy / dist * 100);
                }
                if (data.gathered) {
                    e.x += Math.sin(this.time.now / 200) * 0.5;
                }
            }
        }

        if (this.registry.get('health') <= 0 && !this.victoryTriggered) {
            this.endGame('End');
        }

        if (!this.victoryTriggered && this.registry.get('score') >= 100) {
            this.endGame('Win');
        }
    }

    endGame(nextScene) {
        this.victoryTriggered = true;
        this.scene.get('galleryShoot').events.emit('stop-background');
        this.enemyEvent.remove();
        this.phoneEvent.remove();
        this.wrenchEvent.remove();
        for (let data of this.enemyData) {
            if (!data.retreating && data.sprite && data.sprite.body) {
                data.retreating = true;
                this.physics.moveTo(data.sprite, data.sprite.x, -100, 150);
                this.time.delayedCall(1000, () => {
                    if (data.sprite && data.sprite.destroy) data.sprite.destroy();
                });
            }
        }
        this.cameras.main.fadeOut(1000);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(nextScene);
        });
    }

    spawnEnemy() {
        let type = Phaser.Math.Between(1, 3);
        let spriteKey = `enemy${type}`;
        let x, y;
    
        if (type === 1) {
            // Comes from the right
            x = 700;
            y = Phaser.Math.Between(100, 900);
        } else if (type === 2) {
            // Comes from the top
            x = Phaser.Math.Between(100, 540);
            y = -50;
        } else {
            // Comes from the left
            x = -50;
            y = Phaser.Math.Between(100, 900);
        }
    
        let enemy = this.enemies.create(x, y, spriteKey).setScale(2.5);
        this.physics.world.enable(enemy);
        
        let offset = Phaser.Math.Between(-100, 100);
        let offsetY = Phaser.Math.Between(-20, 20);
        this.enemyData.push({ sprite: enemy, hp: 2, type, offset, offsetY, gathered: false, retreating: false });
    }
    

    enemyThrowPhone() {
        for (let data of this.enemyData) {
            if (data.gathered && !data.retreating && Phaser.Math.Between(0, 1) === 0) {
                let phone = this.enemyProjectiles.create(data.sprite.x, data.sprite.y, 'phone');
                phone.setVelocityY(200);
                phone.setScale(0.5);
            }
        }
    }

    spawnWrench() {
        let wrench = this.healthItems.create(Phaser.Math.Between(100, 540), -50, 'wrench');
        wrench.setVelocityY(150);
        wrench.setScale(0.5);
    }

    hitEnemy(projectile, enemy) {
        projectile.destroy();
        let data = this.enemyData.find(e => e.sprite === enemy);
        if (data) {
            data.hp--;
            if (data.hp <= 0 && !data.retreating) {
                data.retreating = true;
                data.gathered = false;
    
                // Determine offscreen exit point based on spawn direction
                let targetX, targetY;
                switch (data.type) {
                    case 1: // enemy1 came from right
                        targetX = 700;
                        targetY = data.sprite.y;
                        break;
                    case 2: // enemy2 came from top
                        targetX = data.sprite.x;
                        targetY = -100;
                        break;
                    case 3: // enemy3 came from left
                        targetX = -100;
                        targetY = data.sprite.y;
                        break;
                }
    
                if (data.sprite.body) {
                    this.physics.moveTo(data.sprite, data.sprite.x, -100, 150);
                }                
                this.time.delayedCall(1500, () => {
                    if (data.sprite && data.sprite.destroy) data.sprite.destroy();
                });
            }
        }
    
        let score = this.registry.get('score') + 5;
        this.registry.set('score', score);
        this.scoreText.setText('Score: ' + score);
    }
    

    hitPlayer(player, enemy) {
        if (enemy && enemy.destroy) enemy.destroy();
        this.hurtSound.play();
        let health = this.registry.get('health') - 1;
        this.registry.set('health', health);
        let icon = this.healthIcons.getChildren().pop();
        if (icon) icon.destroy();
    }

    hitByPhone(player, phone) {
        if (phone && phone.destroy) phone.destroy();
        this.hurtSound.play();
        let health = this.registry.get('health') - 1;
        this.registry.set('health', health);
        let icon = this.healthIcons.getChildren().pop();
        if (icon) icon.destroy();
    }

    collectWrench(player, wrench) {
        /*if (wrench && wrench.destroy) wrench.destroy();
        let health = this.registry.get('health') + 1;
        this.registry.set('health', health);
        // Insert new icon at the front of the array (leftmost)
        this.healthIcons.children.entries.unshift(this.add.image(35, 25, 'wrench').setScale(0.4));

        // Shift all icons to the right of the first
        this.healthIcons.children.each((icon, i) => {
            icon.x = 35 + i * 25;
        });*/
        if (wrench && wrench.destroy) wrench.destroy();
        let health = this.registry.get('health') + 1;
        this.registry.set('health', health);

        const icon = this.add.image(50 + (this.healthIcons.getLength() * 25), 65, 'wrench').setScale(0.4);
        this.healthIcons.add(icon);
    }
}

export default Game;
