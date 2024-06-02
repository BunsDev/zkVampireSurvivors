// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract GameStaticData{
    struct Skin {
        string name;
        uint life;
        uint16[7] hp;
        uint8[7] atk;
        uint16[7] speed;
        uint priceType; // 0: Gold; 1: Diamond
        uint price;
    }

    struct Weapon {
        uint8[4] atk;
        uint atkRange;
        uint flySpeed;
        uint8[4] atkSpeed;
        uint bulletNum;
        uint8[4] bulletTotal;
        uint reload;
        uint priceType; // 0: Gold; 1: Diamond
        uint price;
    }

    uint[] public skinIdList;
    uint[] public weaponIdList;
    mapping(uint => Skin) public skinMap;
    mapping(uint => Weapon) public weaponMap;

    constructor()
    {
        initSkinList();
        initWeaponList();
    }

    function getAllSkinId() external view returns(uint[] memory) {
        return skinIdList;
    }

    function getAllSkinById(uint id) external view returns(Skin memory) {
        return skinMap[id];
    }

    function initSkinList() internal {
        skinIdList = [0,1,2,3];
        skinMap[0] = Skin(
            "Hero1",
            3,
            [330, 350, 360, 370, 380, 400, 450],
            [1, 2, 4, 6, 8, 9, 10],
            [520, 530, 540, 550, 560, 570, 580],
            0,
            0
        );
        skinMap[1] = Skin(
            "Hero2",
            3,
            [350, 370, 380, 390, 420, 430, 440],
            [2, 4, 5, 6, 8, 10, 12],
            [525, 535, 545, 555, 565, 575, 600],
            0,
            1000
        );
        skinMap[2] = Skin(
            "Hero3",
            4,
            [360, 370, 380, 390, 400, 420, 450],
            [4, 6, 8, 10, 12, 14, 18],
            [523, 534, 556, 576, 587, 602, 624],
            0,
            2500
        );
        skinMap[3] = Skin(
            "Hreo4",
            6,
            [400, 420, 440, 460, 480, 500, 520],
            [1, 2, 4, 6, 8, 10, 12],
            [502, 513, 523, 533, 543, 553, 563],
            1,
            1000
        );
    }

    function getAllWeaponId() external view returns(uint[] memory) {
        return weaponIdList;
    }

    function getAllWeaponById(uint id) external view returns(Weapon memory) {
        return weaponMap[id];
    }

    function initWeaponList() internal {
        weaponIdList = [0,1,5,6,7,8,9,15,16,18];
        weaponMap[0] = Weapon(
            [30, 33, 35, 40],
            1000,
            2500,
            [35, 35, 40, 40],
            30,
            [90, 90, 90, 120],
            3,
            0,
            0
        );
        weaponMap[1] = Weapon(
            [20, 22, 25, 30],
            1000,
            2500,
            [40, 40, 45, 50],
            25,
            [75, 75, 100, 100],
            2,
            0,
            1000
        );
        weaponMap[5] = Weapon(
            [140, 160, 180, 200],
            1000,
            2000,
            [2, 2, 2, 2],
            2,
            [10, 12, 14, 16],
            3,
            0,
            1500
        );
        weaponMap[6] = Weapon(
            [40, 45, 48, 50],
            1000,
            2000,
            [3, 4, 5, 5],
            20,
            [60, 80, 100, 120],
            3,
            0,
            2000
        );
        weaponMap[7] = Weapon(
            [40, 45, 50, 60],
            1000,
            2000,
            [20, 25, 25, 40],
            8,
            [24, 32, 40, 48],
            2,
            0,
            500
        );
        weaponMap[8] = Weapon(
            [20, 25, 30, 40],
            1500,
            2500,
            [1, 1, 2, 2],
            2,
            [8, 10, 12, 14],
            3,
            0,
            5000
        );
        weaponMap[9] = Weapon(
            [100, 120, 130, 140],
            800,
            2000,
            [20, 25, 40, 40],
            3,
            [15, 18, 21, 24],
            3,
            1,
            500
        );
        weaponMap[15] = Weapon(
            [110, 150, 200, 250],
            2000,
            3000,
            [1, 1, 1, 2],
            1,
            [11, 12, 13, 15],
            3,
            1,
            500
        );
        weaponMap[16] = Weapon(
            [35, 40, 45, 50],
            1000,
            2000,
            [5, 5, 5, 5],
            15,
            [45, 50, 75, 90],
            3,
            0,
            3000
        );
        weaponMap[18] = Weapon(
            [30, 35, 40, 45],
            1000,
            2500,
            [9, 9, 9, 9],
            50,
            [150, 150, 200, 250],
            3,
            1,
            1000
        );
    }
}
