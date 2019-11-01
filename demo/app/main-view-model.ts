import { View } from "tns-core-modules/ui/core/view";
import * as dialogs from 'tns-core-modules/ui/dialogs';
import { Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { Prop } from './utils/obs-prop';
import { Bluetooth, Peripheral } from 'nativescript-bluetooth';

export class DemoAppModel extends Observable {
  @Prop() public isLoading = false;

  public peripherals = new ObservableArray<Peripheral>();
  private _bluetooth = new Bluetooth();

  constructor() {
    super();
    // enables the console.logs from the Bluetooth source code
    this._bluetooth.debug = true;
    console.log('enabled', this._bluetooth.enabled);

    // using an event listener instead of the 'onDiscovered' callback of 'startScanning'
    this._bluetooth.on(Bluetooth.device_discovered_event, (eventData: any) => {
      console.log('Peripheral found: ' + JSON.stringify(eventData.data));
      this.peripherals.push(<Peripheral>eventData.data);
    });
  }

  public doIsBluetoothEnabled() {
    console.log('doIsBluetoothEnabled tap');
    if (this._bluetooth.enabled === false) {
      dialogs.alert('Bluetooth is DISABLED.');
    } else {
      dialogs.alert('Bluetooth is ENABLED.');
    }
  }

  public doEnableBluetooth() {
    this._bluetooth.enable().then(enabled => {
      setTimeout(() => {
        dialogs.alert({
          title: 'Did the user allow enabling Bluetooth by our app?',
          message: enabled ? 'Yes' : 'No',
          okButtonText: 'OK, nice!'
        });
      }, 500);
    });
  }

  public onPeripheralTap(args) {
    console.log('!!&&&&***** Clicked item with index ' + args.index);
    const peri = this.peripherals.getItem(args.index);
    console.log('--- peripheral selected: ' + peri.UUID);

    // const view = <View>args.view;
    // const page = <Page>view.page;

    topmost().navigate({
      moduleName: 'services-page',
      context: {
        info: 'something you want to pass to your page',
        foo: 'bar',
        peripheral: peri
      },
      animated: true
    });
  }

  // this one 'manually' checks for permissions
  public doScanForHeartrateMontitor() {
    this._bluetooth.hasCoarseLocationPermission().then(granted => {
      if (!granted) {
        this._bluetooth.requestCoarseLocationPermission().then(
          // doing it like this for demo / testing purposes.. better usage is demonstrated in 'doStartScanning' below
          granted2 => {
            dialogs.alert({
              title: 'Granted?',
              message: granted2 ? 'Yep - now invoke that button again' : 'Nope',
              okButtonText: 'OK!'
            });
          }
        );
      } else {
        var heartrateService = '180d';
        var omegaService = '12345678-9012-3456-7890-1234567890ee';

        this.isLoading = true;
        // reset the array
        this.peripherals.splice(0, this.peripherals.length);
        this._bluetooth
          .startScanning({
            // beware: the peripheral must advertise ALL these services
            serviceUUIDs: [omegaService],
            seconds: 4,
            onDiscovered: peripheral => {
              this.peripherals.push(peripheral);
            },
            skipPermissionCheck: false
          })
          .then(
            p => {
              this.isLoading = false;
              console.log('p', p);
            },
            err => {
              this.isLoading = false;
              dialogs.alert({
                title: 'Whoops!',
                message: err,
                okButtonText: 'OK, got it'
              });
            }
          );
      }
    });
  }

  // this one uses automatic permission handling
  public doStartScanning() {
    this.isLoading = true;
    // reset the array
    this.peripherals.length = 0;
    this._bluetooth
      .startScanning({
        serviceUUIDs: [], // pass an empty array to scan for all services
        seconds: 5, // passing in seconds makes the plugin stop scanning after <seconds> seconds
        onDiscovered: peripheral => {
          console.log("peripheral discovered. Not adding it here because we're using a listener.");
          // this.peripherals.push(peripheral);
        },
        skipPermissionCheck: false
      })
        .then(() => this.isLoading = false)
        .catch(err => {
          this.isLoading = false;
          dialogs.alert({
            title: 'Whoops!',
            message: err ? err : 'Unknown error',
            okButtonText: 'OK, got it'
          });
        }
      );
  }

  public doStopScanning() {
    this._bluetooth.stopScanning().then(
      () => {
        this.isLoading = false;
      },
      err => {
        dialogs.alert({
          title: 'Whoops!',
          message: err,
          okButtonText: 'OK, so be it'
        });
      }
    );
  }

  /*
  DemoAppModel.prototype.doWrite = function () {
    // send 1 byte to switch a light on
    var data = new Uint8Array(1);
    data[0] = 1;

    bluetooth.write(
      {
        peripheralUUID: mostRecentlyFoundperipheralUUID,
        serviceUUID: "B9401000-F5F8-466E-AFF9-25556B57FE6D", // TODO dummy
        characteristicUUID: "B9402001-F5F8-466E-AFF9-25556B57FE6D", // TODO dummy
        value: data.buffer,
        awaitResponse: true // if false you will not get notified of errors (fire and forget)
      }
    ).then(
      function(result) {
        dialogs.alert({
          title: "Write result",
          message: JSON.stringify(result),
          okButtonText: "OK, splendid"
        });
      },
      function (err) {
        dialogs.alert({
          title: "Whoops!",
          message: err,
          okButtonText: "Hmmkay"
        });
      }
    );
  };
*/
}
