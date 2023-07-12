(function () {
    'use strict';
    function sek_start() {
        function guid() {
            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        }
        //创建webSocket 连接
        
        var client = new SekiroClientTest("ws://127.0.0.1:5612/business-demo/register?group=test&clientId=" + guid());
        //注册一个行动监听
        client.registerAction("encrypt", function (request, resolve, reject) {
            try {
        
                var data = request['data']
             //   var cyvk = window._cyvk(user);
                resolve(window._d(data))
            } catch (e) {
                reject("error: " + e);
            }
        });
        client.registerAction("Decrypt", function (request, resolve, reject) {
            try {
        
                var data = request['data']
             //   var cyvk = window._cyvk(user);
                resolve(window._d(data))
            } catch (e) {
                reject("error: " + e);
            }
        });

    }

    console.log("超时连接")
    setTimeout(sek_start, 2000)


//==============================================================================================================================================//
// 连接配置函数, 不许修改
    function SekiroClientTest(e) {
        if (this.wsURL = e, this.handlers = {}, this.socket = {}, !e) throw new Error("wsURL can not be empty!!");
        this.webSocketFactory = this.resolveWebSocketFactory(), this.connect()
    }

    SekiroClientTest.prototype.resolveWebSocketFactory = function () {
        if ("object" == typeof window) {
            var e = window.WebSocket ? window.WebSocket : window.MozWebSocket;
            return function (o) {
                function t(o) {
                    this.mSocket = new e(o)
                }

                return t.prototype.close = function () {
                    this.mSocket.close()
                }, t.prototype.onmessage = function (e) {
                    this.mSocket.onmessage = e
                }, t.prototype.onopen = function (e) {
                    this.mSocket.onopen = e
                }, t.prototype.onclose = function (e) {
                    this.mSocket.onclose = e
                }, t.prototype.send = function (e) {
                    this.mSocket.send(e)
                }, new t(o)
            }
        }
        if ("object" == typeof weex) try {
            console.log("test webSocket for weex");
            var o = weex.requireModule("webSocket");
            return console.log("find webSocket for weex:" + o), function (e) {
                try {
                    o.close()
                } catch (e) {
                }
                return o.WebSocket(e, ""), o
            }
        } catch (e) {
            console.log(e)
        }
        if ("object" == typeof WebSocket) return function (o) {
            return new e(o)
        };
        throw new Error("the js environment do not support websocket")
    }, SekiroClientTest.prototype.connect = function () {
        console.log("sekiro: begin of connect to wsURL: " + this.wsURL);
        var e = this;
        try {
            this.socket = this.webSocketFactory(this.wsURL)
        } catch (o) {
            return console.log("sekiro: create connection failed,reconnect after 2s:" + o), void setTimeout(function () {
                e.connect()
            }, 2e3)
        }
        this.socket.onmessage(function (o) {
            e.handleSekiroRequest(o.data)
        }), this.socket.onopen(function (e) {
            console.log("sekiro: open a sekiro client connection")
        }), this.socket.onclose(function (o) {
            console.log("sekiro: disconnected ,reconnection after 2s"), setTimeout(function () {
                e.connect()
            }, 2e3)
        })​
