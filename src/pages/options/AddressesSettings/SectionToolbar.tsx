import { ChangeEvent, MouseEvent, useCallback, useEffect, useState } from 'react';
import { Box, Button, TextField, Snackbar, Alert } from '@mui/material';
import {
  ContentPaste as ContentPasteIcon,
  RestorePage as RestorePageIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import * as murmurhash from 'murmurhash';

import '@src/shared/console';

interface SectionToolbarProps {
  initialUrl?: string;
  updateUrl: (url: string) => void;
  setLabels: (labels: string) => void;
  setCurrentLabelsHash: (hash: number) => void;
  validate: (content: string) => void;
  handleSave: () => void;
  getSection: () => void;
  canRevert: boolean;
  canSave: boolean;
}

export default function SectionToolbar({
  initialUrl,
  updateUrl,
  setLabels,
  setCurrentLabelsHash,
  validate,
  handleSave,
  getSection,
  canRevert,
  canSave,
}: SectionToolbarProps) {
  const [fetchUrl, setFetchUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);

  // Initialize fetchUrl from props
  useEffect(() => {
    if (initialUrl) {
      setFetchUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleUrlChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setFetchUrl(newUrl);
      updateUrl(newUrl);
    },
    [updateUrl],
  );

  const handleFetch = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      let response;
      try {
        response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setIsSnackbarOpen(true);
        return;
      }

      const content = await response.text();
      setLabels(content);
      const hash = murmurhash.v3(content);
      setCurrentLabelsHash(hash);
      validate(content);
    },
    [fetchUrl, setLabels, setCurrentLabelsHash, validate],
  );

  const handlePaste = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      const clipboardContents = await window.navigator.clipboard.readText();
      const hash = murmurhash.v3(clipboardContents);
      setLabels(clipboardContents);
      setCurrentLabelsHash(hash);
      validate(clipboardContents);
    },
    [setLabels, setCurrentLabelsHash, validate],
  );

  const handleRevert = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      getSection();
    },
    [getSection],
  );

  const handleSaveClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      handleSave();
    },
    [handleSave],
  );

  const handleCloseError = useCallback(() => {
    setIsSnackbarOpen(false);
  }, []);

  const handleExited = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          size="small"
          placeholder="Enter URL to fetch addresses from (optional)"
          value={fetchUrl}
          onChange={handleUrlChange}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          className="section-fetch-button"
          startIcon={<DownloadIcon />}
          title="Click to fetch addresses from the URL"
          disabled={!fetchUrl.trim()}
          onClick={handleFetch}
          sx={{ mr: 1 }}>
          Fetch
        </Button>
        <Button
          variant="contained"
          className="section-paste-button"
          startIcon={<ContentPasteIcon />}
          title="Click to import addresses from the clipboard"
          onClick={handlePaste}
          sx={{ mr: 2 }}>
          Paste
        </Button>
        <Button
          variant="contained"
          className="section-revert-button"
          startIcon={<RestorePageIcon />}
          title="Click to discard changes"
          onClick={handleRevert}
          disabled={!canRevert}>
          Discard changes
        </Button>
        <Button
          variant="contained"
          className="section-save-button"
          startIcon={<SaveIcon />}
          title="Click or type Ctrl+S to save changes"
          onClick={handleSaveClick}
          disabled={!canSave}>
          Save
        </Button>
      </Box>
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionProps={{
          onExited: handleExited,
        }}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          Error fetching URL: {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
