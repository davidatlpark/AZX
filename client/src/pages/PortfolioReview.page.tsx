import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Alert,
  Group,
  Paper,
  Table,
  Badge,
  Loader,
  Center,
  Switch,
  TextInput,
  Modal,
  ActionIcon,
  Tooltip,
  NumberInput,
  Pagination,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
  IconEdit,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

interface MappedRow {
  [key: string]: string | number | boolean | string[];
  _originalIndex: number;
  _isEdited: boolean;
  _isValid: boolean;
  _errors: string[];
}

interface EditModalData {
  rowIndex: number;
  field: string;
  value: string;
  label: string;
}

const ROWS_PER_PAGE = 50;

export function PortfolioReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mappedData, setMappedData] = useState<MappedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvalidOnly, setShowInvalidOnly] = useState<boolean>(false);
  const [showEditedOnly, setShowEditedOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalData, setEditModalData] = useState<EditModalData | null>(
    null
  );
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);

  const { file, columnMappings } = location.state || {};

  // Optimized CSV parsing with better error handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  };

  // Check if a row has any meaningful data
  const isRowEmpty = (values: string[]): boolean => {
    return values.every((value) => !value || value.trim() === "");
  };

  // Check if a row has sufficient data to be meaningful
  const isRowMeaningful = (values: string[], headers: string[]): boolean => {
    if (isRowEmpty(values)) return false;

    // Count non-empty values
    const nonEmptyCount = values.filter(
      (value) => value && value.trim() !== ""
    ).length;

    // Row is meaningful if it has at least 2 non-empty values or 1 non-empty value that's substantial
    if (nonEmptyCount >= 2) return true;
    if (nonEmptyCount === 1) {
      const nonEmptyValue = values.find(
        (value) => value && value.trim() !== ""
      );
      return nonEmptyValue ? nonEmptyValue.trim().length > 2 : false;
    }

    return false;
  };

  const parseAndMapData = async () => {
    if (!file || !columnMappings) {
      setError("Missing file or column mappings");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0); // Filter out completely empty lines

      if (lines.length <= 1) {
        setError("CSV file appears to be empty or contains only headers");
        setLoading(false);
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);

      console.log(`Found ${dataLines.length} potential data rows...`);

      // Filter out empty or meaningless rows
      const meaningfulDataLines = dataLines.filter((line: string) => {
        const values = parseCSVLine(line);
        return isRowMeaningful(values, headers);
      });

      console.log(
        `Processing ${meaningfulDataLines.length} meaningful rows (filtered out ${dataLines.length - meaningfulDataLines.length} empty rows)...`
      );

      if (meaningfulDataLines.length === 0) {
        setError("No meaningful data found in CSV file");
        setLoading(false);
        return;
      }

      // Validate that we have mappings for the headers
      const hasValidMappings = headers.some(
        (header) =>
          columnMappings[header] && columnMappings[header] !== "ignored"
      );

      if (!hasValidMappings) {
        setError(
          "No valid column mappings found. Please go back and map your columns."
        );
        setLoading(false);
        return;
      }

      // Process meaningful data in batches
      const batchSize = 100;
      const mapped: MappedRow[] = [];

      for (let i = 0; i < meaningfulDataLines.length; i += batchSize) {
        const batch = meaningfulDataLines.slice(i, i + batchSize);

        const batchMapped = batch.map((row: string, batchIndex: number) => {
          const values = parseCSVLine(row);
          const mappedRow: MappedRow = {
            _originalIndex: i + batchIndex,
            _isEdited: false,
            _isValid: true,
            _errors: [],
          };

          // Apply column mappings
          headers.forEach((header, headerIndex) => {
            const mapping = columnMappings[header];
            if (mapping && mapping !== "ignored") {
              const value = values[headerIndex] || "";
              mappedRow[mapping] = value.trim();
            }
          });

          // Validate the row
          const validation = validateRow(mappedRow);
          mappedRow._isValid = validation.isValid;
          mappedRow._errors = validation.errors;

          return mappedRow;
        });

        mapped.push(...batchMapped);

        // Allow UI to update between batches
        if (i + batchSize < meaningfulDataLines.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      console.log(`Successfully processed ${mapped.length} meaningful rows`);
      setMappedData(mapped);
      setLoading(false);
    } catch (err) {
      console.error("Error processing CSV:", err);
      setError("Failed to parse CSV file. Please check the file format.");
      setLoading(false);
    }
  };

  const validateRow = (
    row: MappedRow
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Helper function to get string value
    const getStringValue = (key: string): string => {
      const value = row[key];
      return typeof value === "string" ? value.trim() : "";
    };

    // Check if row has any meaningful data at all
    const mappedValues = Object.keys(row)
      .filter((key) => !key.startsWith("_"))
      .map((key) => getStringValue(key))
      .filter((val) => val.length > 0);

    if (mappedValues.length === 0) {
      errors.push("Row contains no meaningful data");
      return { isValid: false, errors };
    }

    // Check required field combinations for geocoding
    const hasFormattedAddress =
      getStringValue("formatted_address") &&
      (getStringValue("country") || getStringValue("country_code"));
    const hasAddressLine =
      getStringValue("address_line") &&
      getStringValue("city") &&
      (getStringValue("country") || getStringValue("country_code"));
    const hasBuildingAddress =
      (getStringValue("house_number") || getStringValue("name")) &&
      getStringValue("city") &&
      (getStringValue("country") || getStringValue("country_code"));
    const hasCoordinates =
      getStringValue("latitude") && getStringValue("longitude");

    if (
      !hasFormattedAddress &&
      !hasAddressLine &&
      !hasBuildingAddress &&
      !hasCoordinates
    ) {
      errors.push("Missing required address information for geocoding");
    }

    // Validate coordinates if present
    const latitude = getStringValue("latitude");
    const longitude = getStringValue("longitude");

    if (latitude) {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push("Invalid latitude (must be between -90 and 90)");
      }
    }

    if (longitude) {
      const lngNum = parseFloat(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push("Invalid longitude (must be between -180 and 180)");
      }
    }

    // Validate postal code format (basic check)
    const postalCode = getStringValue("postal_code");
    if (postalCode && postalCode.length > 20) {
      errors.push("Postal code is too long");
    }

    // Validate country code format
    const countryCode = getStringValue("country_code");
    if (countryCode && countryCode.length !== 2) {
      errors.push("Country code must be 2 characters");
    }

    // Validate state code format
    const stateCode = getStringValue("state_code");
    if (stateCode && stateCode.length > 3) {
      errors.push("State code is too long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Memoized filtered data for better performance
  const filteredData = useMemo(() => {
    let filtered = mappedData;

    if (showInvalidOnly) {
      filtered = filtered.filter((row) => !row._isValid);
    }

    if (showEditedOnly) {
      filtered = filtered.filter((row) => row._isEdited);
    }

    return filtered;
  }, [mappedData, showInvalidOnly, showEditedOnly]);

  // Memoized pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  // Memoized stats
  const stats = useMemo(() => {
    const validCount = mappedData.filter((row) => row._isValid).length;
    const invalidCount = mappedData.filter((row) => !row._isValid).length;
    const editedCount = mappedData.filter((row) => row._isEdited).length;

    return { validCount, invalidCount, editedCount };
  }, [mappedData]);

  // Memoized mapped fields
  const mappedFields = useMemo(() => {
    return Object.values(columnMappings).filter(
      (v) => v !== "ignored"
    ) as string[];
  }, [columnMappings]);

  useEffect(() => {
    if (!file || !columnMappings) {
      if (!file) {
        console.error("No file found in navigation state");
        navigate("/portfolio/import");
      } else if (!columnMappings) {
        console.error("No column mappings found in navigation state");
        navigate("/portfolio/import/mapping", { state: { file } });
      }
      return;
    }

    parseAndMapData();
  }, [file, columnMappings, navigate]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [showInvalidOnly, showEditedOnly]);

  const handleEditClick = (rowIndex: number, field: string, value: string) => {
    setEditModalData({
      rowIndex,
      field,
      value,
      label: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    });
    openEditModal();
  };

  const handleEditSave = (newValue: string) => {
    if (editModalData) {
      const updatedData = [...mappedData];
      const row = updatedData[editModalData.rowIndex];

      // Update the value
      row[editModalData.field] = newValue;
      row._isEdited = true;

      // Re-validate the row
      const validation = validateRow(row);
      row._isValid = validation.isValid;
      row._errors = validation.errors;

      setMappedData(updatedData);
    }
    closeEditModal();
  };

  const handleNext = () => {
    navigate("/portfolio/import/details", {
      state: {
        file,
        columnMappings,
        mappedData,
        step: 4,
      },
    });
  };

  const handleBack = () => {
    navigate("/portfolio/import/mapping", {
      state: {
        file,
        columnMappings,
      },
    });
  };

  const getFieldValue = (row: MappedRow, field: string): string => {
    const value = row[field];
    return typeof value === "string" ? value : String(value || "");
  };

  const isFieldEditable = (field: string): boolean => {
    return !["_originalIndex", "_isEdited", "_isValid", "_errors"].includes(
      field
    );
  };

  if (!file || !columnMappings) {
    return null;
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Processing mapped data...</Text>
            <Text size="sm" color="dimmed">
              Filtering out empty rows and validating data...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
        <Group justify="center" mt="md">
          <Button onClick={handleBack} variant="outline">
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  const { validCount, invalidCount, editedCount } = stats;
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">
            Import Portfolio
          </Title>
          <Text color="dimmed" size="lg">
            Step 3 of 5: Review and Edit Data
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>Data Review</Title>
                <Text size="sm" color="dimmed">
                  Review the mapped data and fix any validation errors
                </Text>
              </div>
              <Group gap="md">
                <Badge color="green" variant="light">
                  Valid: {validCount}
                </Badge>
                <Badge color="red" variant="light">
                  Invalid: {invalidCount}
                </Badge>
                <Badge color="blue" variant="light">
                  Edited: {editedCount}
                </Badge>
              </Group>
            </Group>

            <Group gap="md">
              <Switch
                label="Show invalid rows only"
                checked={showInvalidOnly}
                onChange={(event) =>
                  setShowInvalidOnly(event.currentTarget.checked)
                }
              />
              <Switch
                label="Show edited rows only"
                checked={showEditedOnly}
                onChange={(event) =>
                  setShowEditedOnly(event.currentTarget.checked)
                }
              />
            </Group>

            <div style={{ overflowX: "auto" }}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>Status</Table.Th>
                    {mappedFields.map((field) => (
                      <Table.Th key={field}>
                        {field
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Table.Th>
                    ))}
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((row) => (
                    <Table.Tr key={row._originalIndex}>
                      <Table.Td>{(row._originalIndex as number) + 1}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {row._isValid ? (
                            <Badge color="green" variant="light">
                              Valid
                            </Badge>
                          ) : (
                            <Badge color="red" variant="light">
                              Invalid
                            </Badge>
                          )}
                          {row._isEdited && (
                            <Badge color="blue" variant="light">
                              Edited
                            </Badge>
                          )}
                        </Group>
                        {(row._errors as string[]).length > 0 && (
                          <div style={{ marginTop: "4px" }}>
                            {(row._errors as string[])
                              .slice(0, 3)
                              .map((error, i) => (
                                <Text key={i} size="xs" color="red">
                                  • {error}
                                </Text>
                              ))}
                            {(row._errors as string[]).length > 3 && (
                              <Text size="xs" color="dimmed">
                                ... and {(row._errors as string[]).length - 3}{" "}
                                more
                              </Text>
                            )}
                          </div>
                        )}
                      </Table.Td>
                      {mappedFields.map((field) => (
                        <Table.Td key={field}>
                          <Group gap="xs">
                            <Text
                              size="sm"
                              style={{ maxWidth: "200px" }}
                              truncate
                            >
                              {getFieldValue(row, field) || "-"}
                            </Text>
                            {isFieldEditable(field) && (
                              <Tooltip label="Edit field">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() =>
                                    handleEditClick(
                                      row._originalIndex as number,
                                      field,
                                      getFieldValue(row, field)
                                    )
                                  }
                                >
                                  <IconEdit size={12} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      ))}
                      <Table.Td>
                        <Group gap="xs">
                          {row._isValid ? (
                            <Tooltip label="Valid row">
                              <IconCheck size={16} color="green" />
                            </Tooltip>
                          ) : (
                            <Tooltip label="Invalid row">
                              <IconX size={16} color="red" />
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
                <Text size="sm" color="dimmed">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)}{" "}
                  of {filteredData.length} rows
                </Text>
              </Group>
            )}

            {filteredData.length === 0 && (
              <Center py="xl">
                <Text color="dimmed">
                  {showInvalidOnly || showEditedOnly
                    ? "No data matches the current filters"
                    : "No data to display"}
                </Text>
              </Center>
            )}

            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Data Summary"
              color="blue"
              variant="light"
            >
              <Text size="sm">
                Total rows: {mappedData.length} | Valid: {validCount} | Invalid:{" "}
                {invalidCount} | Edited: {editedCount}
              </Text>
              {invalidCount > 0 && (
                <Text size="sm" color="orange" mt="xs">
                  ⚠️ {invalidCount} rows have validation errors that should be
                  fixed before proceeding
                </Text>
              )}
            </Alert>
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Button
            onClick={handleBack}
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            leftSection={<IconArrowRight size={16} />}
          >
            Next: Portfolio Details
          </Button>
        </Group>
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={`Edit ${editModalData?.label}`}
        size="md"
      >
        {editModalData && (
          <EditFieldModal
            data={editModalData}
            onSave={handleEditSave}
            onCancel={closeEditModal}
          />
        )}
      </Modal>
    </Container>
  );
}

// Separate component for the edit modal content
function EditFieldModal({
  data,
  onSave,
  onCancel,
}: {
  data: EditModalData;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(data.value);

  const handleSave = () => {
    onSave(value);
  };

  const isNumericField =
    data.field === "latitude" || data.field === "longitude";

  return (
    <Stack gap="md">
      <Text size="sm" color="dimmed">
        Row {data.rowIndex + 1} - {data.label}
      </Text>

      {isNumericField ? (
        <NumberInput
          label={data.label}
          value={value}
          onChange={(val) => setValue(val?.toString() || "")}
          placeholder={`Enter ${data.label.toLowerCase()}`}
          decimalScale={6}
          step={0.000001}
        />
      ) : (
        <TextInput
          label={data.label}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={`Enter ${data.label.toLowerCase()}`}
        />
      )}

      <Group justify="flex-end" gap="md">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </Group>
    </Stack>
  );
}