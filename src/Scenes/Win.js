"use strict";

export default class Win extends Phaser.Scene {
    constructor() {
        super("Win");
    }

    create() {
        this.cameras.main.fadeIn(1000);

        const finalScore = this.registry.get('score');
        this.add.text(300, 300, `You Win!\nScore: ${finalScore}`, {
            fontSize: '32px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(300, 400, 'Press SPACE to Restart', {
            fontSize: '20px',
            fill: '#ccc'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            this.scene.start('Game');
        });
    }
}
