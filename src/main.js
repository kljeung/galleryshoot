// main.js
"use strict";

import Title from './Scenes/Title.js';
import Game from './Scenes/Game.js';
import End from './Scenes/End.js';
import Win from './Scenes/Win.js';
import GalleryShoot from './Scenes/GalleryShootScene.js';

let config = {
    type: Phaser.AUTO,
    width: 580,
    height: 640,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    scene: [ Title, Game, End, Win, GalleryShoot],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

let game = new Phaser.Game(config);


