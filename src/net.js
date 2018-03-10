import _ from 'lodash'
import moment from "moment";
import io from 'socket.io-client';
import Peer from 'simple-peer';
import adb from "./db";

class Net {
  constructor() {
    this.peers = {}
  }
  register_ui_evt() {
    vm.$on("notify_seller_status", data => {
      this.emit('notify_seller_status', data)
    });
  }
  init(){
    this.sock = io('https://spy.yunyougo.com/');      
    this.sock.on('connect', this.on_connect.bind(this));
    this.sock.on('ssms_all_yours', this.ssms_all_yours.bind(this));
    this.sock.on('ssm_signal', this.on_ssm_signal.bind(this));
    // this.sock.on('disconnect', (reason) => {
    //   alert('disconnect 11111111111111111111111111111'+JSON.stringify(reason) )
    // });
    // this.sock.on('error', (error) => {
    //   alert('error 11111111111111111111111111111'+JSON.stringify(error) )
    // });
  }
  on_connect() {
    // this.register_ui_evt()
    this.sock.emit('supervisor_online', 'freego');
  }
  ssms_all_yours(data) {
    vm.$emit('ssms_all_yours', _.values(data));
  }
  on_ssm_signal(data) {
    let p = this.peers[data.ssm_hash];
    p.signal(data.ssm_sig_data);
  }
  emit(name, data, cb) {
    if (this.sock) {
      this.sock.emit(name, data, cb)
    }
  }
  new_ssm_peer(ssm) {
    let peer = new Peer({
        trickle: true,
        config: {
            iceServers: [
                { url: 'stun:139.224.228.83' },
                {
                    url: 'turn:139.224.228.83',
                    username: 'freego',
                    credential: 'freego2017'
                },
                {
                    url: 'turn:numb.viagenie.ca',
                    username: 'david@cninone.com',
                    credential: 'freego2017'
                }
            ]
        }
    });
    let sh = ssm.ssm_hash
    this.peers[sh] = peer;
    this.sock.emit('I_want_you', ssm);
    peer.on('signal', (data) => {
        ssm.super_sig_data = data;
        // console.log(ssm);                      
        this.sock.emit('super_signal', ssm);
    });
    peer.on('error', (e) => {
        console.log('Error sending connection to peer', e);
        delete this.peers[sh];
        alert('建立连接失败');
    });
    peer.on('close', () => {
        console.log('Peer connection closed');
        $(`#${sh}`).hide();
        vm.$emit('peer_close', sh);
        delete this.peers[sh];
    })
    peer.on('connect', () => {
        console.log('peer connection established');
        ssm.peer = peer;
        vm.$emit('peer_connected', sh);
    });
    peer.on('data', (data) => {
        
    });
    peer.on('stream', (stream) => {
        console.log('on peer stream');
        $(`#${sh}`)[0].src = window.URL.createObjectURL(stream);
        $(`#${sh}`).show(600);

    });
  }
}
export default new Net;