"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export default function ThemeRegistry({ children }) {
  const [cache] = React.useState(() =>
    createCache({ key: "mui", prepend: true })
  );

  const theme = createTheme();

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}