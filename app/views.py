# encoding=utf-8
from flask import render_template, session, jsonify
from flask import copy_current_request_context
from app import app
from flask.ext.socketio import send, emit
from app import socketio
from threading import Thread, current_thread

# import binascii
import datetime
import time

import json

from converter import *

clients = 0

def listening():
    ser = serial.Serial('/dev/ttyUSB0', 38400)

    global clients
    while True:
        head = binascii.a2b_hex("4C")
        serialRequest(ser)
        rcv = ser.read(bufSize)
        # print rcv
        seq = map(ord,rcv)
        buf = copy.copy(seq)
        pkt = parsePkt(seq)
        pkt['clients'] = clients
        # print pkt
        socketio.emit('push', json.dumps(pkt), namespace='/main')
        # time.sleep(5)
    ser.close()

# Open new thread for Listening function
listen = Thread(target=listening,name="ListenSensor")
# listen.daemon = True


@app.route('/')
@app.route('/index')
def index():
    return render_template("index.html",
        title = 'Sensing via Web')


@socketio.on('my event')
def test_message(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my response',
        {'data': message['data'], 'count': session['receive_count']})


@socketio.on('my broadcast event')
def test_message(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my response',
        {'data': message['data'], 'count': session['receive_count']},
        broadcast=True)


@socketio.on('connect', namespace='/main')
def connect():
    global clients
    clients += 1
    print clients, "Clients Connected"
    # emit('connect',1)
    # Start listening Thread if not exist
    if listen.isAlive() == False:
        listen.start()
        print "Start listening to Sensor"
    else:
        print "Listening Thread already started"
        emit('status', {'msg': 'Connected', 'count': 0})

@socketio.on('disconnect', namespace='/main')
def disconnect():
    global clients
    clients -= 1
    if clients == 0:
        print 'No clients now'
    else:
        print 'Client disconnected, remain', clients

