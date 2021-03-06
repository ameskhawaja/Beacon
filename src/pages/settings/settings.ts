import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, ToastController, AlertController } from 'ionic-angular';
import { FormBuilder, Validators } from '@angular/forms';
import { EmailValidator } from '../../validators/email';
import { PasswordValidator } from '../../validators/password';
import firebase from 'firebase';

import { Camera , CameraOptions} from '@ionic-native/camera'; //added 3/31 by Amanda

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  public UID; 
  public currentUserDB;
  public organization;
  public username;
  public email;
  public phone;
  public address;

  public organizationForm;
  public userForm;
  public passwordForm;

  public capturedDataURL; //user's newly uploaded (taken or selected image)
  public ppURL;

  constructor(public toastCtrl: ToastController, public menuCtrl: MenuController,
   public navCtrl: NavController, public navParams: NavParams,  public formBuilder: FormBuilder, public camera: Camera, public alertCtrl: AlertController) {
  	this.menuCtrl.enable(true, 'navMenu');
    //goes directly to the entry for the user based off of the USER ID. 
    this.UID = firebase.auth().currentUser.uid
    this.currentUserDB = firebase.database().ref('/userProfile/'+ this.UID);

    this.currentUserDB.once('value', userInfo => {
        this.username = (userInfo.val().username);
        this.email = userInfo.val().email;
        this.phone = userInfo.val().phone;
        this.organization = userInfo.val().organization;
        this.address = userInfo.val().address;

     });

    this.organizationForm = formBuilder.group({
      organization: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
      phone: ['', Validators.compose([Validators.minLength(10), Validators.maxLength(10), Validators.required])],
      address: ['', Validators.required]
    });

    this.userForm = formBuilder.group({
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
      phone: ['', Validators.compose([Validators.minLength(10), Validators.maxLength(10), Validators.required])]
    });

    this.passwordForm = formBuilder.group({
      currentPassword: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password1: ['', Validators.compose([Validators.minLength(6), Validators.required, PasswordValidator.passwordsMatch])]
    });

    // this.organizationForm.get('organization').valueChanges.subscribe(value => {
    //   console.log('name has changed:', value);
    //});
    

  }

  //pull profile pick in when page is fully loaded
  ionViewWillEnter(){
    var filename = firebase.auth().currentUser.email;
    firebase.storage().ref().child('/profilePics/' + filename + '.jpg').getDownloadURL().then((url)=>{
      this.ppURL = url;
    },
      (err) => { 
        this.ppURL = "assets/imgs/blank-profile-picture.jpg";
     });
  }


  isOrganization()
  {
    if(this.organization != null)
    {
       return true;
    }
    else
    {
      return false;
    }
  }

  updateUser()
  {
    this.currentUserDB.update({ username: this.username,
     email: this.email, 
     phone: this.phone});
    firebase.auth().currentUser.updateEmail(this.email);
    // An error happened.
        let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile has been updated.',
        buttons: ['Dismiss']
      });
      alert.present();
  }

  updateOrganization()
  {
    this.currentUserDB.update({ username: this.username, 
      email: this.email, 
      phone: this.phone, 
      address: this.address,
      organization: this.organization});
    firebase.auth().currentUser.updateEmail(this.email);
        let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile has been updated.',
        buttons: ['Dismiss']
      });
      alert.present();
  }

  updatePassword()
  {
    var that = this;
    var credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email, that.passwordForm.value.currentPassword);
    firebase.auth().currentUser.reauthenticateWithCredential(credential).then(function() {
      firebase.auth().currentUser.updatePassword(that.passwordForm.value.password1).then(function() {
        console.log("password updated successfully");
        let toast = this.toastCtrl.create({
          message: 'Password Updated Successfully',
          duration: 1000,
          position: 'middle'
        });
        toast.present();
      }).catch(error => {
        let toast = this.toastCtrl.create({
          message: 'Unable to update password',
          duration: 1000,
          position: 'middle'
        });
        toast.present();
      })
    }).catch(error => {
      let toast = this.toastCtrl.create({
        message: 'Invalid password',
        duration: 1000,
        position: 'middle'
      });
      toast.present();
    });
    this.passwordForm.reset();
  }


  async takePhoto(){ //takes image with camera
    const options: CameraOptions = {
        quality: 40,
        destinationType: this.camera.DestinationType.DATA_URL, //gives image back as base 64 image
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE, //only looks for pictures
        saveToPhotoAlbum: true, //saving picture to library  
        correctOrientation: true 
    }
    this.camera.getPicture(options).then((imageData) => { 
      this.capturedDataURL = 'data:image/jpeg;base64,' + imageData;
      //uploading the picture
      let storageRef = firebase.storage().ref();
      const filename = this.email; //naming the file to match the current user's email
      const imageRef = storageRef.child('profilePics/' + filename + '.jpg'); //places picture ref in folder of profile pics with UID as name of file
      imageRef.putString(this.capturedDataURL, firebase.storage.StringFormat.DATA_URL);
      this.ppURL = this.capturedDataURL;//updates photo url to new photo url
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile picture has been updated.',
        buttons: ['Dismiss']
      });
      alert.present();
    },
    (err) => {
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'There was a problem updating you picture. Please try again.',
        buttons: ['Dismiss']
      });
      alert.present();
    });
   
  }


  async getPhoto(){ //pulls from library
    const options: CameraOptions = {
        quality: 40,
        destinationType: this.camera.DestinationType.DATA_URL, //gives image back as base 64 image
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        saveToPhotoAlbum: false,
        correctOrientation: true 
    }
    // code modified from ionic documentation and Maballo Net: pick from gallary
    this.camera.getPicture(options).then((imageData) => { 
      this.capturedDataURL = 'data:image/jpeg;base64,' + imageData;
      //uploading the picture
      let storageRef = firebase.storage().ref();
      const filename = this.email; //naming the file to match the current user's email
      const imageRef = storageRef.child('profilePics/' + filename + '.jpg'); //places picture ref in folder of profile pics with UID as name of file
      imageRef.putString(this.capturedDataURL, firebase.storage.StringFormat.DATA_URL);
      this.ppURL = this.capturedDataURL;//updates photo url to new photo url
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile picture has been updated.',
        buttons: ['Dismiss']
      });
      alert.present();
    },
    (err) => {
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'There was a problem updating you picture. Please try again.',
        buttons: ['Dismiss']
      });
      alert.present();
    });
  }


}
