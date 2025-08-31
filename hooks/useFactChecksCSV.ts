import { useRequest } from "./useRequest"

export function useFactChecksCSV() {
  const { loading, error, data, request } = useRequest()

  const fetchFactChecksCSV = async () => {
    // Step 1: Get the fileId for factchecks.csv
    const fileIdRes = await request.get("/drive/factchecks-csv")
    const fileId = fileIdRes.fileId
    if (!fileId) throw new Error("No factchecks.csv fileId found")
    // Step 2: Fetch the CSV data using the fileId
    return await request.get(`/drive/csv/${fileId}`)
  }

  return { loading, error, data, fetchFactChecksCSV }
}
