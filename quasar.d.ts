import { ComponentCustomProperties } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    $q: any;
  }
}
