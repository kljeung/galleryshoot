// Title.js
"use strict";

class Title extends Phaser.Scene {
    constructor() {
        super('Title');
    }

    preload() {
        this.load.setPath('assets/');
        this.load.image('carFront', 'carFront.png');
        this.load.image('carBack', 'carBack.png');
    }

    create() {
        // Center of screen
        const x = 580/2;
        const y = 640/2;

        // Create container to hold both back and front
        this.car = this.add.container(x, y);
        this.carBack = this.add.image(0, 25, 'carBack').setScale(2.5).setRotation(Math.PI);
        this.carFront = this.add.image(0, -15, 'carFront').setScale(2.5).setRotation(Math.PI); // adjust offset as needed

        this.car.add([this.carBack, this.carFront]);

        this.add.text(160, 100, 'Food Truck Frenzy', { fontSize: '28px', fill: '#fff' });
        this.add.text(160, 500, 'Press SPACE to start', { fontSize: '20px', fill: '#fff' });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });
    }
}

export default Title;
