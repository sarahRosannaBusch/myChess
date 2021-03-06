  
"use strict"

/** @brief myChess web app
 *  @author Sarah Rosanna Busch
 *  @date 3 Dec 2021
 */

//derived from:
//source: https://chessboardjs.com/examples#5000 
//source: https://chessboardjs.com/examples#5003

var myChess = (function() {
    var that = {};

    var board = null
    var game = null
    var $status = null
    var $pgn = null
    var $fen = null
    var myBoard = null
    var whiteSquareGrey = '#a9a9a9'
    var blackSquareGrey = '#696969'

    that.init = function() {
        $status = $('#status')
        $pgn = $('#pgn')
        $fen = $('#fen')
        let fen = sessionStorage.getItem("fen");
        let player = 'w';
        if(fen) {
            player = (fen.split(" ")[1]) === 'w' ? 'w' : 'b';
        }
        let boardPosition = fen ? fen : 'start';
        game = new Chess(fen ? fen : undefined);
        myBoard = document.getElementById('myBoard') //todo investigate why using $('#myBoard') ends up throwing errors on transform
        board = Chessboard('myBoard', {
            draggable: true,
            position: boardPosition,
            dropOffBoard: 'snapback',
            sparePieces: false,
            orientation: player,
            pieceTheme: 'img/chesspieces/myPieces/{piece}.svg',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare
        });
        updateStatus();

        $(window).resize(board.resize);
    }

    that.resetBoard = function() {
        board.start();
        game.reset();
        updateStatus();
    }

    that.undo = function() {
        let lastMove = game.undo();
        if(lastMove) {
            board.move(lastMove.to + '-' + lastMove.from);
            updateStatus();
        } else {
            console.log('undo failed');
            //if page was refreshed mid game, undo will only work back to refresh point
        }
    }

    function updateStatus () {
        var status = ''

        var moveColor = 'White'
        if (game.turn() === 'b') {
            moveColor = 'Black'
        }
        
        let orientation = board.orientation();
        if(orientation !== moveColor.toLowerCase()) {
            flipBoard();
        }

        // checkmate?
        if (game.in_checkmate()) {
            status = 'Game over, ' + moveColor + ' is in checkmate.'
        }

        // draw?
        else if (game.in_draw()) {
            status = 'Game over, drawn position'
        }

        // game still on
        else {
            status = moveColor + ' to move'

            // check?
            if (game.in_check()) {
                status += ', ' + moveColor + ' is in check'
            }
        }
        $status.html(status) //player turn, etc
        sessionStorage.setItem("fen", game.fen());
    }

    function removeGreySquares () {
        $('#myBoard .square-55d63').css('background', '')
    }

    function greySquare (square) {
        var $square = $('#myBoard .square-' + square)

        var background = whiteSquareGrey
        if ($square.hasClass('black-3c85d')) {
            background = blackSquareGrey
        }

        $square.css('background', background)
    }

    function onDragStart (source, piece, position, orientation) {
        // do not pick up pieces if the game is over
        if (game.game_over()) return false

        // only pick up pieces for the side to move
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false
        }
    }

    function onDrop (source, target) {
        removeGreySquares()

        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        })

        // illegal move
        if (move === null) return 'snapback'

        updateStatus()
    }

    function flipBoard() {
        var deg = -90; //neg to give a bit of a delay
        var timer = setInterval(function() {
            deg++;
            if(deg > 0) myBoard.style.transform = "rotate(" + deg + "deg)"
            if(deg >= 180) {
                clearInterval(timer)
                myBoard.style.transform = "rotate(0deg)"
                board.flip()
            }
        }, 1)
    }

    function onMouseoverSquare (square, piece) {
        // get list of possible moves for this square
        var moves = game.moves({
            square: square,
            verbose: true
        })

        // exit if there are no moves available for this square
        if (moves.length === 0) return

        // highlight the square they moused over
        greySquare(square)

        // highlight the possible squares for this piece
        for (var i = 0; i < moves.length; i++) {
            greySquare(moves[i].to)
        }
    }

    function onMouseoutSquare (square, piece) {
        removeGreySquares()
    }

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    function onSnapEnd () {
        board.position(game.fen())
    }

    return that;
}());