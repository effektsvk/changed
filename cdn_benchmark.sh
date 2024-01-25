PACKAGE="@react-native-firebase/app"
hyperfine --warmup 5 "curl https://cdn.jsdelivr.net/npm/$PACKAGE/package.json" "curl unpkg.com/$PACKAGE/package.json" "curl https://registry.npmjs.com/$PACKAGE"
