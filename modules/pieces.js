
import get      from '../../fn/modules/get.js';
import overload from '../../fn/modules/overload.js';

var id = 0;

function create(type, x, y, player) {
    return {
        id:     '' + (++id),
        type:   type,
        square: [x, y, player],
        player: player
    };
}

function perspective(player, square) {
    return player !== square[2] ?
        [7 - square[0], 7 - square[1], player] :
        square ;
}

function normalise(square) {
    return square[1] > 3 ?
        square[0] > 3 ?
            perspective((square[2] + 1) % 3, square) :
            perspective((square[2] + 2) % 3, square) :
        square ;
}

function equals(squareA, squareB) {
    // If a piece is dead, it's square is null, so handle null
    if (!squareA || !squareB) { return false; }

    // Normalise before comparing
    const a = normalise(squareA);
    const b = normalise(squareB);
    return a[2] === b[2]
        && a[1] === b[1] 
        && a[0] === b[0] ;
}

function add(vector, square) {
    return (vector[2] === undefined || vector[2] === square[2]) ?
        [square[0] + vector[0], square[1] + vector[1], square[2]] :
        [square[0] - vector[0], square[1] - vector[1], square[2]] ;
}

function squareIsOnBoard(square) {
    return square[0] > -1
        && square[0] < 8
        && square[1] > -1
        && square[1] < 8;
}

function squareIsUntaken(pieces, player, square) {
    // Checks if square is unoccupied by the current player
    return !pieces.find((piece) => piece.player === player
        && equals(piece.square, square)
    );
}

function squareIsOccupied(pieces, square) {
    return pieces.find((piece) => equals(piece.square, square));
}

function squareIsUnoccupied(pieces, square) {
    return !pieces.find((piece) => equals(piece.square, square));
}

function squareIsSafe(player, square) {
    return true;
}

function squareIsEnemys(pieces, player, square) {
    return !!pieces.find((piece) => piece.player !== player
        && equals(piece.square, square)
    );
}

export function pieces() {
    var pieces = [];
    var player = 3;

    while (player--) {
        pieces.push(create('rook', 0, 0, player));
        pieces.push(create('knight', 1, 0, player));
        pieces.push(create('bishop', 2, 0, player));
        pieces.push(create('king', 3, 0, player));
        pieces.push(create('queen', 4, 0, player));
        pieces.push(create('bishop', 5, 0, player));
        pieces.push(create('knight', 6, 0, player));
        pieces.push(create('rook', 7, 0, player));
        pieces.push(create('pawn', 0, 1, player));
        pieces.push(create('pawn', 1, 1, player));
        pieces.push(create('pawn', 2, 1, player));
        pieces.push(create('pawn', 3, 1, player));
        pieces.push(create('pawn', 4, 1, player));
        pieces.push(create('pawn', 5, 1, player));
        pieces.push(create('pawn', 6, 1, player));
        pieces.push(create('pawn', 7, 1, player));
    }
    
    return pieces;
}

export const getMoveSquares = overload(get('state'), {
    'dead': (piece, pieces) => [],

    'undefined': overload(get('type'), {
        'king': (piece, pieces) => {
            const squares = [];
            var x = -2;
            while (++x < 2) {
                var y = -2;
                while (++y < 2) {
                    if (x === 0 && y === 0) { continue; }
                    const square = add([x, y], piece.square);
                    if (!squareIsOnBoard(square)) { continue; }
                    if (!squareIsUntaken(pieces, piece.player, square)) { continue; }
                    if (!squareIsSafe(square)) { continue; }
                    squares.push(square);
                }
            }
            return squares;
        },
    
        'queen': (piece, pieces) => {
            const squares = [];
            var x = -2;
            while (++x < 2) {
                var y = -2;
                while (++y < 2) {
                    if (x === 0 && y === 0) { continue; }
                    const move = [x, y];
                    var square = add(move, piece.square);
                    while (squareIsOnBoard(square) && squareIsUntaken(pieces, piece.player, square)) {
                        squares.push(square);
                        // No travel beyond a piece we'd have to take
                        if (squareIsOccupied(pieces, square)) {
                            break;
                        }
                        square = add(move, square);
                    }
                }
            }
            return squares;
        },
    
        'bishop': (piece, pieces) => {
            const squares = [];
            const directions = [[1,1], [-1,1], [-1,-1], [1,-1]];
    
            for (var d of directions) {
                var square = add(d, piece.square);
                while (squareIsOnBoard(square) && squareIsUntaken(pieces, piece.player, square)) {
                    squares.push(square);
                    // No travel beyond a piece we'd have to take
                    if (squareIsOccupied(pieces, square)) { break; }
                    square = add(d, square);
                }
            }

            // TODO: include weird diagonals
        
            return squares;
        },
    
        'knight': (piece, pieces) => {
            const squares = [];
            const moves = [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [-1,2], [1,-2], [-1,-2]];
    
            for (var d of moves) {
                var square = add(d, piece.square);
                if (squareIsOnBoard(square) && squareIsUntaken(pieces, piece.player, square)) {
                    squares.push(square);
                }
            }
    
            return squares;
        },
    
        'rook': (piece, pieces) => {
            const squares = [];
            const directions = [[0,1], [0,-1], [-1,0], [1,0]];
    
            for (var d of directions) {
                var square = add(d, piece.square);
                while (squareIsOnBoard(square) && squareIsUntaken(pieces, piece.player, square)) {
                    squares.push(square);
                    // No travel beyond a piece we'd have to take
                    if (squareIsOccupied(pieces, square)) { break; }
                    square = add(d, square);
                }
            }
    
            return squares;
        },
    
        'pawn': (piece, pieces) => {
            const squares  = [];
            const quadrant = piece.square[2];
            const square   = perspective(piece.player, piece.square);

            var move = normalise(add([0,1], square));
            if (squareIsOnBoard(move) && squareIsUnoccupied(pieces, move)) {
                squares.push(move);
 
                // On home pawns row, include a move of 2 squares
                if (piece.square[1] === 1) {
                    move = normalise(add([0,2], square));
                    if (squareIsUnoccupied(pieces, move)) {
                        squares.push(move);
                    }
                }
            }

            move = normalise(add([1,1], square));
            if (squareIsOnBoard(move) && squareIsEnemys(pieces, piece.player, move)) {
                squares.push(move);
            }

            move = normalise(add([-1,1], square));
            if (squareIsOnBoard(move) && squareIsEnemys(pieces, piece.player, move)) {
                squares.push(move);
            }

            // Make sure we include the weird diagonals you get from the 
            // centre squares
            if (square[1] === 3) {
                if (square[0] === 3) {
                    move = perspective((piece.player + 2) % 3, add([1,1], square));
                    if (squareIsEnemys(pieces, piece.player, move)) {
                        squares.push(move);
                    }
                }
                else if (square[0] === 4) {
                    move = perspective((piece.player + 1) % 3, add([-1,1], square));
                    if (squareIsEnemys(pieces, piece.player, move)) {
                        squares.push(move);
                    }
                }
            }
            
            return squares;
        }
    })
});

export function move(piece, pieces, square) {
    const moves = getMoveSquares(piece, pieces);
    const move  = normalise(square);

    if (!moves.find((square) => equals(square, move))) {
        console.log(square, piece, pieces);
        throw new Error('Illegal move ' + square);
    }

    const enemy = pieces.find((piece) => equals(piece.square, move));

    if (enemy) {
        enemy.state  = 'dead';
        enemy.square = null;
        piece.kills  = piece.kills || [];
        piece.kills.push(enemy);
    }

    piece.square = move;
    return enemy;
}
