import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  FileInput,
  Button,
  Stack,
  Alert,
  Group,
  Paper,
  Anchor,
} from "@mantine/core";
import {
  IconUpload,
  IconFileTypeCsv,
  IconDownload,
  IconInfoCircle,
} from "@tabler/icons-react";

export function PortfolioImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type and size
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const downloadTemplate = () => {
    const fields = [
      "id",
      "name",
      "unit",
      "house_number",
      "street",
      "address_line",
      "neighborhood",
      "city",
      "county",
      "state",
      "state_code",
      "country",
      "country_code",
      "postal_code",
      "formatted_address",
      "latitude",
      "longitude",
    ];

    const csvContent = fields.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio_template.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleNext = () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    navigate("/portfolio/import/mapping", { state: { file } });
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">
            Import Portfolio
          </Title>
          <Text color="dimmed" size="lg">
            Step 1 of 5: Select a CSV file
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3} mb="xs">
                  Upload CSV File
                </Title>
                <Text size="sm" color="dimmed">
                  Select a CSV file containing your property portfolio data
                </Text>
              </div>
              <Anchor
                onClick={downloadTemplate}
                size="sm"
                style={{ cursor: "pointer" }}
              >
                <Group gap="xs">
                  <IconDownload size={16} />
                  Download Template
                </Group>
              </Anchor>
            </Group>

            <FileInput
              label="CSV File"
              placeholder="Choose a CSV file..."
              accept=".csv"
              value={file}
              onChange={handleFileChange}
              size="md"
              error={error}
              leftSection={<IconFileTypeCsv size={16} />}
            />

            {file && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                title="File Selected"
                color="blue"
                variant="light"
              >
                <Text size="sm">
                  <strong>File:</strong> {file.name}
                  <br />
                  <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                  <br />
                  <strong>Last Modified:</strong>{" "}
                  {new Date(file.lastModified).toLocaleDateString()}
                </Text>
              </Alert>
            )}

            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Supported Format"
              color="gray"
              variant="light"
            >
              <Text size="sm">
                Please ensure your CSV file contains property data with columns
                that can be mapped to:
              </Text>
              <Text size="sm" mt="xs">
                • Address information (formatted_address, or address_line + city
                + country)
                <br />
                • Building details (name, house_number, street)
                <br />
                • Geographic coordinates (latitude, longitude)
                <br />• Location details (state, state_code, country_code,
                postal_code)
              </Text>
            </Alert>
          </Stack>
        </Paper>

        <Group justify="flex-end">
          <Button
            onClick={handleNext}
            disabled={!file}
            size="md"
            leftSection={<IconUpload size={16} />}
          >
            Next: Map Columns
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
