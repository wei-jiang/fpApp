<template>
  <home data-page="true">
    <header class="header-bar">
      <div class="center">
        <h1 class="title">{{user_title}}</h1>
      </div>
    </header>
    <div class="content">
   
      <div style="justify-content:space-around;margin-top:10px;">

        <button v-if="device_ready && !has_user" class="btn positive" style="flex:1; margin-top:10px;" @click.prevent="reg_user_info()" v-bind:disabled="btn_reg_user_disabled">
          <h3 style="display:inline-block;margin:auto;">
            {{btn_reg_user_disabled?'注册用户信息，请稍候……':'注册用户信息'}}
          </h3>
        </button>

        <button class="btn negative" style="flex:1; margin-top:20px;" @click.prevent="exit_app()">
          <h3 style="display:inline-block;margin:auto;">
            退出程序
          </h3>
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


  
export default {
  name: "PhononHomePage",
  props: {
    app: {
      type: Object
    }
  },
  created: function() {
    this.$root.$on("on_qrcode", qr_code => {
   
    });
    document.addEventListener(
      "deviceready",
      () => {
        this.device_ready = true;
        FingerprintAuth.isAvailable(ret=>{
          // alert( JSON.stringify(ret) )
          if (ret.isAvailable) {
            this.login_user()
          }
        }, msg=>{
          phonon.alert(`您的设备不支持此程序：${msg}`, "需要指纹认证功能");
          this.exit_app()
        });
      },
      false
    );
  },
  mounted() {
    this.app.on({ page: "home", preventClose: false, content: null }, this);//add this for onReady function 
  },
  data() {
    return {
      btn_reg_user_disabled: false,
      has_user:false,
      user_title:'南岳设备管理',
      device_ready: false
    };
  },
  computed: {
    is_empty() {
      return ''
    }
  },
  methods: {
    get_user_id(user_info){
      return `${user_info.name}(${user_info.email})`
    },
    //one time only
    register_fp(user_info){
      let encryptConfig = {
        locale:"zh_CN",
        clientId: "南岳设备管理",
        username: this.get_user_id(user_info),
        password: user_info.token
      }; 
      FingerprintAuth.encrypt(encryptConfig, result=> {
        // alert("successCallback(): " + JSON.stringify(result));
        if (result.withFingerprint) {
            // alert("Successfully encrypted credentials.");
            // alert("Encrypted credentials: " + result.token);  
        } else if (result.withBackup) {
            // alert("Authenticated with backup password");
        }
        // alert("Encrypted credentials: " + result.token);  
        delete user_info.token;
        user_info.finger_token = result.token
        adb.then(db => {
          db.user.insert(user_info)
          this.set_user_info(user_info)
        }) 
      }, error=> {
          if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
              alert("FingerprintAuth Dialog Cancelled!");
          } else {
              alert("FingerprintAuth Error: " + error);
          }
      });
    },
    exit_app(){
      navigator.app.exitApp();
    },
    decrypt_by_fingerprint(user_info){
      let decryptConfig = {
        locale:"zh_CN",
        clientId: "南岳设备管理",
        username: this.get_user_id(user_info),
        token: user_info.finger_token
      };

      FingerprintAuth.decrypt(decryptConfig, result=> {
          // alert("successCallback(): " + JSON.stringify(result));
          if (result.withFingerprint) {
              // alert("Successful biometric authentication.");
              if (result.password) {
                  // alert("Successfully decrypted credential token.");
                  // alert("password: " + result.password);  
              }
          } else if (result.withBackup) {
              // alert("Authenticated with backup password");
          }
          window.access_token = result.password
      }, error=> {
          if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
              // alert("FingerprintAuth Dialog Cancelled!");
          } else {
              // alert("FingerprintAuth Error: " + error);
          }
          const confirm = phonon.confirm('重新验证 或 退出程序？', '验证身份错误', true, '验证身份', '退出程序');
          confirm.on('confirm', ()=> { this.decrypt_by_fingerprint(user_info) } );
          confirm.on('cancel', ()=> { this.exit_app() } );
      });
    },
    //run after device ready
    register_user(qr_code) {
      this.btn_reg_user_disabled = true;
      ////////////////////////////////////////////////
      var req = phonon.ajax({
          method: 'POST',
          url: 'https://pay.cninone.com/reg_app_usr',
          //crossDomain: true,
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify({token: qr_code}),
          timeout: 5000,
          /*headers: {
              'header-name1': 'value1',
              'header-name2': 'value2'
          },*/
          success: (res, xhr)=> {
              // alert('in phonon.ajax success'+JSON.stringify(res) );
              if(res.ret ==0){
                this.register_fp(res.user)
              } else {
                phonon.alert(`请联系【智慧旅游商务】获取用户信息二维码`, "非法的用户信息");
              }
              this.btn_reg_user_disabled = false;
          },
          error: (res, flagError, xhr)=> {
              console.error(flagError);
              alert(`in phonon.ajax error: ${res} ${flagError}`);
              this.btn_reg_user_disabled = false;
          }
      });
    },
    onReady() {
      
    },
    set_user_info(user_info){
      this.user_title = `南岳设备管理（${user_info.name}）`
      this.has_user = true;
    },
    login_user() {
      adb.then(db => {
        const user_info = db.user.findOne({})
        if(user_info){
          this.set_user_info(user_info)
          this.decrypt_by_fingerprint(user_info)
        } else {

        }
      })   
    },
    go_ssm(ssm) {
      phonon.navigator().changePage("product", '');
    },

    reg_user_info(){
      cordova.plugins.barcodeScanner.scan(
          result=> {
            if(result.cancelled){
              phonon.alert("扫码失败，请重试", "用户取消操作");
            } else if(result.text){
              // alert("Format: " + result.format)
              this.register_user(result.text)
            } else {
              phonon.alert("原因未知", "扫码失败");
            }

          },
          error=> {
            phonon.alert("错误原因：" + error, "扫码失败");
          },
          {
              // preferFrontCamera : true, // iOS and Android
              showFlipCameraButton : true, // iOS and Android
              showTorchButton : true, // iOS and Android
              torchOn: true, // Android, launch with the torch switched on (if available)
              saveHistory: true, // Android, save scan history (default false)
              prompt : "读取【智慧旅游】用户信息二维码", // Android
              // resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
              // formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
              // orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
              // disableAnimations : true, // iOS
              disableSuccessBeep: false // iOS and Android
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