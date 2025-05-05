// GalleryShootScene.js
"use strict";

export default class GalleryShoot extends Phaser.Scene {
    constructor() {
        super("galleryShoot");
        this.scrollActive = true;
        this.scrollSpeed = 0.5; // Slower scroll
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("gallery_shoot_tiles", "tilemap_packed.png");    // tile sheet   
        this.load.tilemapTiledJSON("map", "GalleryShootMap.json");       // Load JSON of tilemap
    }

    create() {
        // Add tilemap
        this.mapA = this.make.tilemap({ key: "map", tileWidth: 16, tileHeight: 32 });
        this.mapB = this.make.tilemap({ key: "map", tileWidth: 16, tileHeight: 32 });

        this.tilesetA = this.mapA.addTilesetImage("gallery-shoot-packed", "gallery_shoot_tiles");
        this.tilesetB = this.mapB.addTilesetImage("gallery-shoot-packed", "gallery_shoot_tiles");

        const centerX = this.sys.game.config.width / 2;
        this.layersA = this.createLayerSet(this.mapA, this.tilesetA, 0, centerX);
        this.layersB = this.createLayerSet(this.mapB, this.tilesetB, -1020, centerX); 

        // Set background layers behind everything else
        for (let layer of [...this.layersA, ...this.layersB]) {
            layer.setDepth(-10);
        }

        // Listen for win or lose event
        this.events.on("stop-background", () => {
            this.scrollActive = false;
            for (let layer of [...this.layersA, ...this.layersB]) {
                layer.setVisible(false);
            }
        });
    }

    createLayerSet(map, tileset, offsetY, centerX) {
        const offsetX = centerX - map.widthInPixels * 2.0 / 2; // Center horizontally, scale 2.0
        const roadLayer = map.createLayer("road", tileset, offsetX, offsetY).setScale(2.0);
        const trashLayer = map.createLayer("trash", tileset, offsetX, offsetY).setScale(2.0);
        const lightsLayer = map.createLayer("lights", tileset, offsetX, offsetY).setScale(2.0);
        const windowsLayer = map.createLayer("windows", tileset, offsetX, offsetY).setScale(2.0);
        return [roadLayer, trashLayer, lightsLayer, windowsLayer];
    }

    update() {
        if (this.scrollActive) {
            this.scrollLayers(this.layersA);
            this.scrollLayers(this.layersB);

            // Check score or health condition for stopping scroll
            const score = this.registry.get('score');
            const health = this.registry.get('health');
            if ((score !== undefined && score >= 100) || (health !== undefined && health <= 0)) {
                this.events.emit("stop-background");
            }
        }
    }

    scrollLayers(layers) {
        for (let layer of layers) {
            layer.y += this.scrollSpeed;
            if (layer.y >= 1020) {
                layer.y = -1020; // Reset with consistent overlap
            }
        }
    }
}
