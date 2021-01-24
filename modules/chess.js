import toPolar     from '../../fn/modules/to-polar.js';
import toCartesian from '../../fn/modules/to-cartesian.js';
import events      from '../../dom/modules/events.js';
import delegate    from '../../dom/modules/delegate.js';

import Game from './game.js';

const abs   = Math.abs;
const floor = Math.floor;
const pow   = Math.pow;
const pi    = Math.PI;
const sin30 = 0.5;
const cos30 = Math.cos(pi / 6);

function format(n) {
    return n.toFixed(3).replace(/\.?0*$/, '');
}

function rotate1(x, y) {
    const polar = toPolar(arguments);
    polar[1] += pi * 2 / 3;
    return toCartesian(polar);
}

function rotate2(x, y) {
    const polar = toPolar(arguments);
    polar[1] += pi * 4 / 3;
    return toCartesian(polar);
}

function posX(x, y) {
    return (x + (x / 4) * sin30 * y) * 10 ;
}

function posY(x, y) {
    return ((2 - (abs(x) / 4)) * cos30 * y - (8 * cos30)) * -10 ;
}

function toPosX(player, square) {
    return square[2] === player ?
        posX(square[0], square[1]) :
    square[2] === (player + 1) % 3 ?
        rotate1(toPosX(square[2], square), toPosY(square[2], square))[0] :
        rotate2(toPosX(square[2], square), toPosY(square[2], square))[0] ;
}

function toPosY(player, square) {
    return square[2] === player ?
        posY(square[0], square[1]) :
    square[2] === (player + 1) % 3 ?
        rotate1(toPosX(square[2], square), toPosY(square[2], square))[1] :
        rotate2(toPosX(square[2], square), toPosY(square[2], square))[1] ;
}

function toBoardX(player, square) {
    return toPosX(player, [square[0] - 4 + 0.5, square[1] + 0.5, square[2]]);
}

function toBoardY(player, square) {
    return toPosY(player, [square[0] - 4 + 0.5, square[1] + 0.5, square[2]]);
}


function renderBoard(perspective, pieces) {
    return [
        `<svg viewbox="-84 -72 168 144">`,
        renderSquares(),
        renderPieces(perspective, pieces),
        `<g class="moves-g"></g>`,
        `<\svg>`
    ].join('');
}

function renderSquares() {
    const sector = [
        [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[5,0,0],[6,0,0],[7,0,0],
        [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],[5,1,0],[6,1,0],[7,1,0],
        [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],[5,2,0],[6,2,0],[7,2,0],
        [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],[5,3,0],[6,3,0],[7,3,0]
    ];

    var p = 3;
    var html = '';

    while (p--) {
        html += sector
        .map((square, i) => `<path
            d="M${format(toPosX(p, [square[0] - 4, square[1], square[2]]))} ${format(toPosY(p, [square[0] - 4, square[1], square[2]]))} L${format(toPosX(p, [square[0] - 4 + 1, square[1], square[2]]))} ${format(toPosY(p, [square[0] - 4 + 1, square[1], square[2]]))} L${format(toPosX(p, [square[0] - 4 + 1, square[1] + 1, square[2]]))} ${format(toPosY(p, [square[0] - 4 + 1, square[1] + 1, square[2]]))} L${format(toPosX(p, [square[0] - 4, square[1] + 1, square[2]]))} ${format(toPosY(p, [square[0] - 4, square[1] + 1, square[2]]))} Z" 
            fill="${ floor(i / 8) % 2 ? i % 2 ? '#7c8b94' : '#a3b1b9' : i % 2 ? '#a3b1b9' : '#7c8b94' }"
        ></path>`)
        .join('');
    }

    return html;
}

function renderMoves(pieceId, moves) {
    return moves
        .map((square) => `<circle data-piece="${ pieceId }" data-move="${ JSON.stringify(square) }" cx="${ format(toBoardX(0, square)) }" cy="${ format(toBoardY(0, square)) }" r="4.8" fill="#00336644"></circle>`)
        .join('') ;
}

function renderPieces(perspective, pieces) {
    return pieces
    .filter((piece) => piece.state !== 'dead')
    .map((piece) => `<use href="#${ piece.type }" class="piece" data-player="${ piece.player }" data-piece="${ piece.id }" x="${ format(toBoardX(perspective, piece.square)) }" y="${ format(toBoardY(perspective, piece.square)) }"></use>`)
    .join('');
}

function updatePiece(element, piece) {
    if (piece.state === 'dead') {
        element.remove();
        return;
    }

    element.setAttribute('x', toBoardX(0, piece.square));
    element.setAttribute('y', toBoardY(0, piece.square));
}


const game = new Game();
const player = 0;
const html = renderBoard(player, game.pieces);

console.log('GAME', game);

const div = document.getElementById('game');
div.innerHTML = html;
const svg = div.firstChild;

events('click', div).each(delegate({
    ['[data-player]']: (e) => {
        const player = parseInt(e.target.dataset.player, 10);
        if (player !== game.player) { return; }
        const id = e.target.dataset.piece;
        const moves = game.moves(id);
        const html = renderMoves(id, moves);
        const group = svg.querySelector('.moves-g');
        group.innerHTML = html;
    },

    ['[data-move]']: (e) => {
        const id    = e.target.dataset.piece;
        const piece = game.pieces.find((piece) => piece.id === id);
        const move  = JSON.parse(e.target.dataset.move);
        const kill  = game.move(piece, move);

        // Update piece
        const element = svg.querySelector('.piece[data-piece="' + id + '"]');
        updatePiece(element, piece);

        if (kill) {
            const element = svg.querySelector('.piece[data-piece="' + kill.id + '"]');
            updatePiece(element, kill);
        }
        
        // Empty moves
        const group = svg.querySelector('.moves-g');
        group.innerHTML = '';
    }
}));

