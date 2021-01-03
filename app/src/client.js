import { WebSocketGameLobbyClient } from 'websocket-game-lobby-client';

const App = (function () {
    const gameLobby = new WebSocketGameLobbyClient({
        port: 5000
    });

    //Euclidean distance btwn two points
    const dist = function(x0,y0,x1,y1) {
        return Math.sqrt(Math.pow(x1-x0,2) + Math.pow(y1-y0,2));
    };

    const Canvas = (function () {
        //DOM references
        const canvasEl = document.getElementById("main-canv");
        const ctx = canvasEl.getContext("2d");

        //Static constants
        const width = 1600;
        const height = 900;

        const setCanvasSize = function (w, h) {
            canvasEl.setAttribute("width", w);
            canvasEl.setAttribute("height", h);
        };

        const init = function () {
            setCanvasSize(width, height);
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
        };

        const offsetLeft = canvasEl.offsetLeft;
        const offsetTop = canvasEl.offsetTop;

        //Page coord to canvas coord conversion
        const ptoc = function(c) {
            return {
                x: c.x - offsetLeft,
                y: c.y - offsetTop
            };
        };

        const DrawData = (function () {
            function Point(x, y) {
                this.x = x;
                this.y = y;
                this.next = null;
            }

            //Sets the reference to the next point
            Point.prototype.setNext = function(next) {
                this.next = next;
            };


            function Stroke() {
                this.points = [];
            }

            Stroke.prototype.addPoint = function(point) {
                if (point instanceof Point) {
                    if (this.getLatestPoint() !== null)
                        this.getLatestPoint().setNext(point);
                    this.points.push(point);
                }
                else
                    console.log(`[DrawData::Stroke::addPoint] Argument is not of type Point: type: ${typeof point}`);
            };

            Stroke.prototype.getLatestPoint = function() {
                return (this.points.length > 0) ? this.points[this.points.length-1] : null;
            };

            Stroke.prototype.getFirstPoint = function() {
                return (this.points.length > 0) ? this.points[0] : null;
            }

            const strokes = [];

            const addStroke = function(stroke) {
                if (stroke instanceof Stroke) {
                    strokes.push(stroke);
                }
                else
                    console.log("[DrawData::addStroke] Argument is not of type Stroke");
            };

            const getStrokes = function() {
                return [...strokes];
            };

            const DrawData_exported = {
                Point: Point,
                Stroke: Stroke,
                addStroke: addStroke,
                printStrokes: () => {console.log(strokes);}
            };

            return DrawData_exported;
        })();

        const bindEventListeners = (function() {
            //Chained stroke event
            let strokeInProgress = false;
            let currentStroke = null;
            
            //Mouse pos differential to trigger new point added
            const delta = 4;

            const mouseDownHandler = function(e) {
                currentStroke = new DrawData.Stroke();
                strokeInProgress = true;
                let coords = ptoc({x: e.pageX,  y: e.pageY});
                let newPoint = new DrawData.Point(coords.x,coords.y);
                currentStroke.addPoint(newPoint);

                canvasEl.addEventListener("mousemove", mouseMoveHandler);
            }

            const mouseMoveHandler = function(e) {
                let coords = ptoc({x: e.pageX,  y: e.pageY});
                if (strokeInProgress && currentStroke !== null) {
                    let latestPoint = currentStroke.getLatestPoint();
                    if (dist(coords.x, coords.y, latestPoint.x, latestPoint.y) > delta
                        || latestPoint === null) {
                        let currentPoint = new DrawData.Point(coords.x,coords.y);
                        currentStroke.addPoint(currentPoint);
                        
                        Renderer.clear();
                        Renderer.drawStroke(currentStroke);
                    }
                }
            }

            const mouseUpHandler = function() {
                if (strokeInProgress) {
                    canvasEl.removeEventListener("mousemove", mouseMoveHandler);
                    strokeInProgress = false;
                    DrawData.addStroke(currentStroke);
                    strokeInProgress = null;

                    DrawData.printStrokes();    //Testing
                    Renderer.drawStroke(currentStroke);
                }
            }

            return function() {
                canvasEl.addEventListener("mousedown", mouseDownHandler);
                canvasEl.addEventListener("mouseup", mouseUpHandler);
            };
        })();
        bindEventListeners();


        const Renderer = (function() {
            const drawStroke = function(stroke) {
                if (stroke instanceof DrawData.Stroke) {
                    let currentPoint = stroke.getFirstPoint();
                    ctx.moveTo(currentPoint.x,currentPoint.y);
                    do {
                        currentPoint = currentPoint.next;
                        ctx.lineTo(currentPoint.x,currentPoint.y);
                    }
                    while (currentPoint.next !== null);
                    ctx.stroke();
                }
            };

            const clear = function() {
                ctx.clearRect(0,0,width,height);
            }


            //Represents a stroke in progress, with data expected to be arriving over time
            function StrokeStream(stroke) {
                this.boundStroke = null;
                if (typeof stroke !== 'undefined')
                    this.boundStroke = stroke;
            }

            StrokeStream.prototype.bindStroke = function(stroke) {
                this.boundStroke = stroke;
            }

            StrokeStream.prototype.update = function(stroke) {
                
            }

            let strokeStreams = [];

            const Renderer_exported = {
                drawStroke: drawStroke,
                clear: clear
            };
            
            return Renderer_exported;
        })();

        const Canvas_exported = {
            width: width,
            height: height,
            init: init
        };

        return Canvas_exported;
    })();

    Canvas.init();

    // document.getElementById("game-create").addEventListener("click", () => {
    //     gameLobby.send('create');
    //     console.log(gameLobby);
    // });

})();