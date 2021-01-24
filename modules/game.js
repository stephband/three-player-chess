import { pieces, getMoveSquares, move } from './pieces.js';

export default function Game() {
    this.player  = 0;
    this.pieces  = pieces();
    this.players = [{
        name: 'One',
        pieces: this.pieces.filter((piece) => piece.player === 0)
    }, {
        name: 'Two',
        pieces: this.pieces.filter((piece) => piece.player === 1)
    }, {
        name: 'Three',
        pieces: this.pieces.filter((piece) => piece.player === 2)
    }];
}

Object.assign(Game.prototype, {
    move: function(piece, square) {
        if (typeof piece === 'string') {
            piece = this.pieces.find((p) => p.id === piece);
        }

        if (piece.player !== this.player) {
            throw new Error('Illegal move: piece does not belong to current player ' + this.player);
        }

        const taken = move(piece, this.pieces, square);

        // Cycle player id
        this.player = (this.player + 1) % 3;
        console.log(piece.type + ' to ' + piece.square.join(','));
        return taken;
    },

    moves: function(piece) {
        if (typeof piece === 'string') {
            piece = this.pieces.find((p) => p.id === piece);
        }

        return piece.player === this.player 
            && getMoveSquares(piece, this.pieces) ;
    }
});
