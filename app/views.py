# encoding=utf-8
from flask import render_template, session, jsonify
from flask import copy_current_request_context
from app import app
from flask.ext.socketio import send, emit
from app import socketio
from threading import Thread, current_thread
from lirc.lirc import Lirc
# import binascii
import datetime
import time

import json
import glob


from converter import *

def scan():
    return glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')

sensor = '/dev/ttyUSB0'
clients = 0
newTask = {"update": False}
lircParse = Lirc('/etc/lirc/lircd.conf')
devices = []
for dev in lircParse.devices():
    d = {
        'id': dev,
        'name': dev,
    }
    devices.append(d)
# lircParse.send_once("livingroom", "KEY_1")
def listening():
    global newTask
    while True:
        ports = scan()
        if sensor in ports:
            ser = serial.Serial(sensor, 38400)

            global clients
            while True:
                head = binascii.a2b_hex("4C")
                serialRequest(ser)
                rcv = ser.read(bufSize)
                seq = map(ord,rcv)
                if seq[0] != 15 and seq[1] != 90:
                    continue
                buf = copy.copy(seq)
                pkt = parsePkt(seq)
                pkt['clients'] = clients
                print newTask
                taskValue =0
                if newTask['update'] == True:
                    if newTask['condition'] == "0":
                        taskValue = pkt['light']
                    elif newTask['condition'] == "1":
                        taskValue = pkt['radi']
                    elif newTask['condition'] == "2":
                        taskValue = pkt['flowV']

                    print newTask['trigger']
                    if int(newTask['trigger']) == 1:
                        print taskValue
                        if taskValue >= int(newTask['value']):
                            print taskValue, int(newTask['value'])
                            if newTask['tv'] == True:
                                lircParse.send_once("tv", "KEY_1")
                                print ">tv"
                                time.sleep(1)
                            if newTask['light'] == True:
                                lircParse.send_once("light", "KEY_2")
                                print ">light"
                                time.sleep(1)
                            if newTask['aircon'] == True:
                                lircParse.send_once("aircon", "KEY_2")
                                print ">air"
                                time.sleep(1)
                            newTask['update'] = False

                #print pkt
                    if int(newTask['trigger']) == 0:
                        print taskValue
                        if taskValue < int(newTask['value']):
                            print taskValue, int(newTask['value'])
                            if newTask['tv'] == True:
                                lircParse.send_once("tv", "KEY_1")
                                print "<tv"
                            if newTask['light'] == True:
                                lircParse.send_once("light", "KEY_2")
                                print "<light"
                            if newTask['aircon'] == True:
                                lircParse.send_once("aircon", "KEY_2")
                                print "<aircon"
                            newTask['update'] = False
                #print pkt
                socketio.emit('push', json.dumps(pkt), namespace='/main')
                # time.sleep(5)
            ser.close()
        else:
            print "Device " + sensor + " not found, wait for operation"
        time.sleep(30)

# Open new thread for Listening function
listen = Thread(target=listening,name="ListenSensor")
listen.daemon = True


@app.route('/')
@app.route('/index')
def index():
    return render_template("index.html",
        title = 'Sensing via Web')

@socketio.on('controlTV', namespace='/main')
def change(status):
    print "tv"
    print status
    if status == False:
        print "off"
        lircParse.send_once("tv", "KEY_3")
    elif status == True:
        lircParse.send_once("tv", "KEY_1")
        print "on"

@socketio.on('controlLight', namespace='/main')
def change(status):
    print "light"
    print type(status)
    if status == 0:
        print "off"
        lircParse.send_once("light", "KEY_1")
    elif status == 1:
        lircParse.send_once("light", "KEY_2")
        print "half"
    elif status == 2:
        lircParse.send_once("light", "KEY_3")
        print "on"

@socketio.on('controlAC', namespace='/main')
def change(status):
    print "ac", status
    if status == 0:
        lircParse.send_once("aircon", "KEY_1")
    elif status == 1:
        lircParse.send_once("aircon", "KEY_2")

@socketio.on('task', namespace='/main')
def change(task):
    global newTask
    newTask = task
    newTask['update'] = True
    print "newTask"

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

