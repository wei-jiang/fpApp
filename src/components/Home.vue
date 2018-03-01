<template>
  <home data-page="true">
    <header class="header-bar">
      <div class="center">
        <h1 class="title">{{user_title}}</h1>
      </div>
    </header>
    <div class="content">
   
      <div style="justify-content:space-around;margin-top:10px;">

        <button v-if="device_ready && !has_user" class="btn positive" style="flex:1; margin-top:10px;" @click.prevent="read_mch_info()" v-bind:disabled="btn_read_mch_disabled">
          <h3 style="display:inline-block;margin:auto;">
            {{btn_read_mch_disabled?'注册用户信息，请稍候……':'读取用户信息'}}
          </h3>
        </button>
        <button class="btn primary" @click.prevent="decrypt_by_fingerprint()">
          指纹解锁
        </button>  
        <button class="btn primary" @click.prevent="exit_app()">
          退出程序
        </button>  
        
      </div>
      
    </div>
  </home>
</template>

<script>
import moment from "moment";
import _ from "lodash";
import Noty from "noty";
import adb from "../db";
import net from "../net";
import util from "../common/util"

window.on_qr = function(qr) {
  // alert(qr);
  qr = JSON.parse(qr);
  if (qr.ret == 0) {
    //扫码成功，通过qr.qr_code获取二维码
    // alert(qr.qr_code);
    vm.$emit("on_qrcode", qr.qr_code);
  } else {
    phonon.alert("扫码失败，请重试", "用户取消操作");
  }
};
  
export default {
  name: "PhononHomePage",
  props: {
    app: {
      type: Object
    }
  },
  created: function() {
    this.$root.$on("on_qrcode", qr_code => {
      this.qr_dealer && this.qr_dealer(qr_code)      
    });

  },
  mounted() {
    this.app.on({ page: "home", preventClose: false, content: null }, this);//add this for onReady function

    document.addEventListener(
      "deviceready",
      () => {
        this.device_ready = true;
        FingerprintAuth.isAvailable(ret=>{
          // alert( JSON.stringify(ret) )
          if (ret.isAvailable) {
            this.login_user()
            ////
              let encryptConfig = {
                locale:"zh_CN",
                clientId: "南岳设备管理",
                username: "david",
                password: "currentTokenString111111111111111111111111111"
              }; 
              FingerprintAuth.encrypt(encryptConfig, result=> {
                alert("successCallback(): " + JSON.stringify(result));
                if (result.withFingerprint) {
                    alert("Successfully encrypted credentials.");
                    alert("Encrypted credentials: " + result.token);  
                    localStorage.setItem('fg_token', result.token)
                } else if (result.withBackup) {
                    alert("Authenticated with backup password");
                }
              }, error=> {
                  if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
                      alert("FingerprintAuth Dialog Cancelled!");
                  } else {
                      alert("FingerprintAuth Error: " + error);
                  }
              });
          }
        }, msg=>{
          phonon.alert("您的设备不支持此程序：" + msg, "需要指纹认证功能");
        });
      },
      false
    );
    
    this.update_mch_info()    
  },
  data() {
    return {
      btn_read_mch_disabled: false,
      qr_dealer:null,
      has_user:false,
      user_title:'',
      device_ready: false
    };
  },
  computed: {
    is_empty() {
      return ''
    }
  },
  methods: {
    exit_app(){
      navigator.app.exitApp();
    },
    decrypt_by_fingerprint(){
      let fg_token = localStorage.getItem('fg_token')
      let decryptConfig = {
        locale:"zh_CN",
        clientId: "南岳设备管理",
        username: "david",
        token: fg_token
      };

      FingerprintAuth.decrypt(decryptConfig, result=> {
          alert("successCallback(): " + JSON.stringify(result));
          if (result.withFingerprint) {
              alert("Successful biometric authentication.");
              if (result.password) {
                  alert("Successfully decrypted credential token.");
                  alert("password: " + result.password);  
              }
          } else if (result.withBackup) {
              alert("Authenticated with backup password");
          }
      }, error=> {
          if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
              alert("FingerprintAuth Dialog Cancelled!");
          } else {
              alert("FingerprintAuth Error: " + error);
          }
      });
    },
    //run after device ready
    register_user() {
      
    },
    onReady() {
      
    },
    login_user() {
      adb.then(db => {
        this.products = _.map(db.product.find({}), p=>{
          let cp = _.clone(p);
          cp.selected = false;
          cp.count = 1;
          return cp
        });

      })   
    },
    go_ssm(ssm) {
      phonon.navigator().changePage("product", '');
    },

    handle_mch_info(qr_code){
      this.btn_read_mch_disabled = true;
      net.emit( "verify_mch_token", qr_code,
        res => {
          if(res.ret == 0){
            let capable = util.ability_title(res.info.ability)
            adb.then(db => {
              db.mch.remove(db.mch.find({}));
              db.mch.insert({token:qr_code,info:res.info});
              this.update_mch_info()
              phonon.alert(`【${res.info.name}】商户可以读取(${capable})付款码收款！`, `导入${res.info.name}商户成功`);
            })                
          } else {
            phonon.alert("无效的商户信息！", "读取商户信息失败");
          }          
          this.btn_read_mch_disabled = false;          
        }
      );
    },
    
    read_mch_info(){
      this.qr_dealer = this.handle_mch_info
      this.read_qr()
    },

    update_mch_info() {
      adb.then(db => {
        const mch = db.mch.findOne({});
        if(mch){
          let capable = util.ability_title(mch.info.ability)
          this.user_title = `${mch.info.name}收银台（${capable}）`
          this.has_user = true;
        } else {
          this.user_title = '南岳设备管理'
          this.has_user = false;
        }
      });
    },
    read_qr() {      
      window.Pos.scan_by_camera(
        data=> {
          // alert(data);
        },
        err=> {
          alert(err);
        }
      );
    }

  }
};
</script>
<style scoped>
.order_info {
  display: flex;
  flex-flow: row;
  justify-content: space-around;
  background-color: aquamarine;
  border-style: inset;
}
.order {
  margin-top: 5px;
  border: 1px dotted purple;
}
.content {
  display: flex;
  flex-flow: column;
}
.content > div {
  display: flex;
  flex-flow: column;
}
.his-data,
.order {
  display: flex;
  flex-flow: column;
}


.parameters {
  margin-bottom: 10px;
}
.result {
  padding-right: 10px;
}
.parameters > div {
  border: 2px dashed coral;
  display: flex;
  flex-flow: row;
}
.caption {
  font-size: 28px;
  margin: auto;
}
input {
  flex: 1;
}

.btn.primary {
  flex: 1;
  min-width: 100px;
}
input[type="checkbox"] {
  margin-left: auto;
  width: 28px; 
  height:28px;
}
input[type="date"]:after {
  content: attr(placeholder);
}
</style>